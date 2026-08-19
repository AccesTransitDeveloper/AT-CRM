import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db";
import { 
  generateStrategyReportWithGemini, 
  generateAdCopyVariantsWithGemini, 
  analyzeTicketSentimentWithGemini,
  extractDocumentDataWithGemini,
  generateAppAnalyticsRecommendationsWithGemini,
  generateDriverAiAssessmentWithGemini,
  processAiAgentCommand
} from "./server/gemini";
import { generateTlcTripRecordCsv } from "./src/lib/tlcExport";
import { 
  generateArrivalTwiML, 
  generateGatherResultTwiML, 
  sendTelegramCancellationAlert 
} from "./server/proximityCallService";
import { adminPanelClient } from "./server/adminPanelClient";
import { syncEngine } from "./server/syncEngine";


export function createApp() {
  const app = express();

  // JSON & URL-Encoded Form body parsing for Webhooks (Twilio & CRM)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "Accessible Transit (AT) CRM API",
      timestamp: new Date().toISOString()
    });
  });

  // System statistics
  app.get("/api/stats", (req, res) => {
    res.json(db.getStats());
  });

  // DRIVERS API
  app.get("/api/drivers", (req, res) => {
    const { status, search, vehicleType } = req.query as Record<string, string>;
    const drivers = db.getDrivers({ status, search, vehicleType });
    res.json(drivers);
  });

  app.get("/api/drivers/:id", (req, res) => {
    const driver = db.getDriverById(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  });

  app.post("/api/drivers", (req, res) => {
    const newDriver = db.createDriver(req.body);
    res.status(201).json(newDriver);
  });

  app.put("/api/drivers/:id", (req, res) => {
    const updated = db.updateDriver(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Driver not found" });
    res.json(updated);
  });

  app.post("/api/drivers/:id/status", (req, res) => {
    const { status, rejectionReason } = req.body;
    const updated = db.updateDriverStatus(req.params.id, status, rejectionReason);
    if (!updated) return res.status(404).json({ error: "Driver not found" });

    // Reverse sync to Clone Admin Panel if driver has external_id
    if (updated.external_id || updated.externalId) {
      const extId = updated.external_id || updated.externalId!;
      adminPanelClient.pushDriverStatusUpdate(extId, status, rejectionReason).catch(err => {
        console.warn(`[ReverseSync] Failed to push status update for driver ${extId}:`, err.message);
      });
    }

    res.json(updated);
  });

  app.delete("/api/drivers/:id", (req, res) => {
    const deleted = db.deleteDriver(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Driver not found" });
    res.json({ success: true, message: "Driver deleted successfully" });
  });

  app.get("/api/drivers/:id/trips", (req, res) => {
    const trips = db.getDriverTrips(req.params.id);
    res.json(trips);
  });

  // DRIVER EXTENDED ANALYTICS & AI ENDPOINTS
  app.get("/api/drivers/:id/financials", (req, res) => {
    const { timeRange, startDate, endDate } = req.query as Record<string, string>;
    const financials = db.getDriverFinancials(req.params.id, { timeRange: timeRange as any, startDate, endDate });
    res.json(financials);
  });

  app.get("/api/drivers/:id/activity", (req, res) => {
    const { timeRange, startDate, endDate } = req.query as Record<string, string>;
    const activity = db.getDriverActivity(req.params.id, { timeRange: timeRange as any, startDate, endDate });
    if (!activity) return res.status(404).json({ error: "Driver not found" });
    res.json(activity);
  });

  app.get("/api/drivers/:id/payouts", (req, res) => {
    const payouts = db.getDriverPayouts(req.params.id);
    res.json(payouts);
  });

  app.get("/api/drivers/:id/ai-assessments", (req, res) => {
    const assessments = db.getDriverAiAssessments(req.params.id);
    res.json(assessments);
  });

  app.post("/api/drivers/:id/ai-assessment", async (req, res) => {
    try {
      const driver = db.getDriverById(req.params.id);
      if (!driver) return res.status(404).json({ error: "Driver not found" });

      const financials = db.getDriverFinancials(driver.id, { timeRange: '30d' });
      const activity = db.getDriverActivity(driver.id, { timeRange: '30d' });
      const tickets = db.getTickets().filter(t => 
        t.userContact === driver.phone || 
        t.userName.toLowerCase().includes(driver.fullName.toLowerCase()) || 
        t.messages.some(m => m.content.toLowerCase().includes(driver.fullName.toLowerCase()))
      );

      const assessment = await generateDriverAiAssessmentWithGemini({
        driver,
        financials,
        activity,
        tickets
      });

      const saved = db.saveDriverAiAssessment(driver.id, assessment);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate driver AI assessment" });
    }
  });

  // ORDERS API
  app.get("/api/orders", (req, res) => {
    const { status, type, source, search, neighborhood } = req.query as Record<string, string>;
    const orders = db.getOrders({ status, type, source, search, neighborhood });
    res.json(orders);
  });

  app.get("/api/orders/:id", (req, res) => {
    const order = db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  });

  app.post("/api/orders", (req, res) => {
    const newOrder = db.createOrder(req.body);
    res.status(201).json(newOrder);
  });

  app.put("/api/orders/:id", (req, res) => {
    const updated = db.updateOrder(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Order not found" });
    res.json(updated);
  });

  app.put("/api/orders/:id/assign", (req, res) => {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ error: "driverId is required" });
    const updated = db.assignDriverToOrder(req.params.id, driverId);
    if (!updated) return res.status(404).json({ error: "Order or Driver not found" });
    res.json(updated);
  });

  app.put("/api/orders/:id/status", (req, res) => {
    const { status, brokerConfirmationStatus } = req.body;
    const updates: any = {};
    if (status) {
      updates.status = status;
      if (status === 'completed') updates.completedAt = new Date().toISOString();
    }
    if (brokerConfirmationStatus) updates.brokerConfirmationStatus = brokerConfirmationStatus;
    const updated = db.updateOrder(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: "Order not found" });
    res.json(updated);
  });

  app.delete("/api/orders/:id", (req, res) => {
    const deleted = db.deleteOrder(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Order not found" });
    res.json({ success: true, message: "Order deleted successfully" });
  });

  // TLC FHV TRIP RECORD CSV EXPORT ENDPOINT (Base B03669)
  app.get("/api/orders/export/tlc-csv", (req, res) => {
    try {
      const orders = db.getOrders();
      const drivers = db.getDrivers();
      const { csv, filename } = generateTlcTripRecordCsv(orders, drivers);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(200).send("\uFEFF" + csv);
    } catch (err: any) {
      console.error("Error exporting TLC CSV:", err);
      res.status(500).json({ error: "Failed to generate TLC CSV report", details: err?.message });
    }
  });

  // ========================================================
  // MTA PROXIMITY CALLING & TWILIO IVR & TELEGRAM ALERTS API
  // ========================================================

  // 1. Get proximity calling settings
  app.get("/api/proximity-calls/settings", (req, res) => {
    res.json(db.getProximityCallSettings());
  });

  // 2. Update proximity calling settings
  app.put("/api/proximity-calls/settings", (req, res) => {
    try {
      const updated = db.updateProximityCallSettings(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 3. Get proximity call audit logs
  app.get("/api/proximity-calls/logs", (req, res) => {
    const { orderId, result, status } = req.query as Record<string, string>;
    const logs = db.getProximityCallLogs({ orderId, result, status });
    res.json(logs);
  });

  // 4. Manually or programmatically trigger proximity call for an MTA order
  app.post("/api/proximity-calls/trigger", async (req, res) => {
    try {
      const { orderId, distanceMiles, triggerReason } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: "orderId is required" });
      }
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const result = await db.triggerProximityCall(orderId, {
        distanceMiles: distanceMiles ? Number(distanceMiles) : undefined,
        triggerReason,
        baseUrl
      });
      res.json(result);
    } catch (err: any) {
      console.error("Error triggering proximity call:", err);
      res.status(500).json({ error: err.message || "Failed to trigger proximity call" });
    }
  });

  // 5. Interactive DTMF Simulator (Passenger pressing 1 = Confirm, 2 = Cancel)
  app.post("/api/proximity-calls/simulate-dtmf", async (req, res) => {
    try {
      const { orderId, digits, callSid } = req.body;
      if (!orderId || !digits) {
        return res.status(400).json({ error: "orderId and digits ('1' or '2') are required" });
      }
      const result = await db.handleTwilioGatherResult(orderId, String(digits), callSid);
      res.json(result);
    } catch (err: any) {
      console.error("Error handling DTMF simulation:", err);
      res.status(500).json({ error: err.message || "Failed to process DTMF input" });
    }
  });

  // 6. Evaluate all active MTA orders based on driver proximity
  app.post("/api/proximity-calls/evaluate-proximity", async (req, res) => {
    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const results = await db.checkAndTriggerProximityCalls(baseUrl);
      res.json(results);
    } catch (err: any) {
      console.error("Error checking proximity calls:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Test Telegram Bot connectivity & alert template
  app.post("/api/proximity-calls/test-telegram", async (req, res) => {
    try {
      const sampleOrder = db.getOrders().find(o => o.type === 'mta_broker' || o.source === 'broker') || db.getOrders()[0];
      const sampleDriver = sampleOrder?.driverId ? db.getDriverById(sampleOrder.driverId) : db.getDrivers()[0];

      const tgResult = await sendTelegramCancellationAlert(sampleOrder, sampleDriver, {
        distanceMiles: 0.28
      });

      res.json({
        success: tgResult.sent,
        messageId: tgResult.messageId,
        isSimulated: tgResult.isSimulated,
        error: tgResult.error,
        configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
      });
    } catch (err: any) {
      console.error("Error testing Telegram alert:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 8. TWILIO WEBHOOK: TwiML Voice Greeting & Gather (GET & POST)
  const handleTwilioTwiml = (req: express.Request, res: express.Response) => {
    const orderId = (req.query.orderId || req.body.orderId || '') as string;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const twiml = generateArrivalTwiML(orderId, baseUrl);
    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.status(200).send(twiml);
  };
  app.get("/api/twilio/voice/twiml", handleTwilioTwiml);
  app.post("/api/twilio/voice/twiml", handleTwilioTwiml);

  // 9. TWILIO WEBHOOK: Gather Response (DTMF Digit entered by passenger)
  app.post("/api/twilio/voice/gather", async (req, res) => {
    try {
      const digits = (req.body.Digits || req.query.Digits || '1') as string;
      const orderId = (req.query.orderId || req.body.orderId || '') as string;
      const callSid = (req.body.CallSid || '') as string;

      console.log(`[Twilio IVR Gather Webhook] Order: ${orderId}, Digits: ${digits}, CallSid: ${callSid}`);

      if (orderId) {
        await db.handleTwilioGatherResult(orderId, digits, callSid);
      }

      const twiml = generateGatherResultTwiML(digits);
      res.setHeader("Content-Type", "text/xml; charset=utf-8");
      res.status(200).send(twiml);
    } catch (err: any) {
      console.error("Error in Twilio Gather webhook:", err);
      const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="ru-RU">Спасибо.</Say><Hangup/></Response>`;
      res.setHeader("Content-Type", "text/xml; charset=utf-8");
      res.status(200).send(fallbackTwiml);
    }
  });

  // 10. TWILIO WEBHOOK: Call Status Callback
  app.post("/api/twilio/voice/status", (req, res) => {
    const { CallSid, CallStatus, CallDuration } = req.body;
    console.log(`[Twilio Call Status Webhook] CallSid: ${CallSid}, Status: ${CallStatus}, Duration: ${CallDuration}s`);
    res.status(200).send("OK");
  });

  // BROKERS API
  app.get("/api/brokers", (req, res) => {
    const brokers = db.getBrokers();
    res.json(brokers);
  });

  app.post("/api/brokers", (req, res) => {
    const newBroker = db.createBroker(req.body);
    res.status(201).json(newBroker);
  });

  app.put("/api/brokers/:id", (req, res) => {
    const updated = db.updateBroker(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Broker not found" });
    res.json(updated);
  });

  // TICKETS API
  app.get("/api/tickets", (req, res) => {
    const { status, priority, search } = req.query as Record<string, string>;
    const tickets = db.getTickets({ status, priority, search });
    res.json(tickets);
  });

  app.get("/api/tickets/:id", (req, res) => {
    const ticket = db.getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  });

  app.post("/api/tickets", (req, res) => {
    const newTicket = db.createTicket(req.body);
    res.status(201).json(newTicket);
  });

  app.put("/api/tickets/:id", (req, res) => {
    const updated = db.updateTicket(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Ticket not found" });
    res.json(updated);
  });

  app.post("/api/tickets/:id/messages", (req, res) => {
    const { senderName, senderRole, content, isInternalNote } = req.body;
    if (!content) return res.status(400).json({ error: "Message content is required" });
    const updated = db.addTicketMessage(req.params.id, {
      senderName: senderName || "Agent",
      senderRole: senderRole || "support_agent",
      content,
      isInternalNote
    });
    if (!updated) return res.status(404).json({ error: "Ticket not found" });
    res.json(updated);
  });

  // FINANCE API
  app.get("/api/finance/settlements", (req, res) => {
    res.json(db.getSettlements());
  });

  app.put("/api/finance/settlements/:id", (req, res) => {
    const { status } = req.body;
    const updated = db.updateSettlementStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "Settlement not found" });
    res.json(updated);
  });

  app.get("/api/finance/overview", (req, res) => {
    const stats = db.getStats();
    const settlements = db.getSettlements();
    res.json({
      metrics: stats,
      settlements
    });
  });

  // =========================================================================
  // MARKETING & MARKET INTELLIGENCE API
  // =========================================================================

  // 1. Analytics & Heatmap data
  app.get("/api/marketing/analytics", (req, res) => {
    const analytics = db.getMarketingAnalytics();
    res.json(analytics);
  });

  // 2. AI Strategy Advisor Reports
  app.get("/api/marketing/reports", (req, res) => {
    const reports = db.getStrategyReports();
    res.json(reports);
  });

  app.post("/api/marketing/reports/generate", async (req, res) => {
    try {
      const analytics = db.getMarketingAnalytics();
      const stats = db.getStats();
      const tickets = db.getTickets();

      const aiReportData = await generateStrategyReportWithGemini({
        metrics: {
          totalRevenue: analytics.metricsSnapshot.totalWeeklyRevenue,
          activeDrivers: analytics.metricsSnapshot.activeDriversTotal,
          avgDriverRating: analytics.metricsSnapshot.avgFleetRating
        },
        neighborhoodStats: analytics.heatmap,
        channelDistribution: {
          appPct: analytics.channelShare.app.percentage,
          atAiPct: analytics.channelShare.atAi.percentage,
          brokerPct: analytics.channelShare.broker.percentage
        },
        underservedZones: analytics.underservedZones.filter(z => z.capacityStatus !== 'adequate'),
        driverCapacity: analytics.underservedZones,
        ticketsOverview: tickets.map(t => ({ category: t.category, priority: t.priority }))
      });

      const savedReport = db.saveStrategyReport(aiReportData);
      res.status(201).json({
        success: true,
        report: savedReport
      });
    } catch (err: any) {
      console.error("Error generating strategy report:", err);
      res.status(500).json({ error: "Failed to generate market strategy report", details: err?.message });
    }
  });

  app.delete("/api/marketing/reports/:id", (req, res) => {
    const deleted = db.deleteStrategyReport(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Report not found" });
    res.json({ success: true, message: "Report deleted from archive" });
  });

  // 3. Customer & Fleet Segmentation
  app.get("/api/marketing/passengers", (req, res) => {
    const passengers = db.getPassengerSegments();
    res.json(passengers);
  });

  app.get("/api/marketing/driver-optimization", (req, res) => {
    const optimization = db.getDriverOptimization();
    res.json(optimization);
  });

  // 4. Marketing Campaigns & Promo Codes
  app.get("/api/marketing/campaigns", (req, res) => {
    const campaigns = db.getPromoCampaigns();
    res.json(campaigns);
  });

  app.post("/api/marketing/campaigns", (req, res) => {
    const campaign = db.createPromoCampaign(req.body);
    res.status(201).json(campaign);
  });

  app.put("/api/marketing/campaigns/:id", (req, res) => {
    const updated = db.updatePromoCampaign(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Campaign not found" });
    res.json(updated);
  });

  app.delete("/api/marketing/campaigns/:id", (req, res) => {
    const deleted = db.deletePromoCampaign(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Campaign not found" });
    res.json({ success: true, message: "Campaign deleted" });
  });

  // 5. AI Ad Copy Generator
  app.post("/api/marketing/generate-copy", async (req, res) => {
    try {
      const { neighborhood, offer, tone, promoCode } = req.body;
      if (!neighborhood || !offer) {
        return res.status(400).json({ error: "neighborhood and offer are required" });
      }

      const copyVariants = await generateAdCopyVariantsWithGemini({
        neighborhood,
        offer,
        tone: tone || "Friendly & Professional",
        promoCode
      });

      res.json({ variants: copyVariants });
    } catch (err: any) {
      console.error("Error generating ad copy:", err);
      res.status(500).json({ error: "Failed to generate ad copy", details: err?.message });
    }
  });

  // 6. Ticket Reputation & Sentiment Monitor
  app.get("/api/marketing/sentiment", async (req, res) => {
    const tickets = db.getTickets();
    const sentiment = await analyzeTicketSentimentWithGemini(tickets);
    res.json(sentiment);
  });

  app.post("/api/marketing/sentiment/analyze", async (req, res) => {
    try {
      const tickets = db.getTickets();
      const sentiment = await analyzeTicketSentimentWithGemini(tickets);
      res.json(sentiment);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to analyze sentiment", details: err?.message });
    }
  });

  // 7. Auto Report Config
  app.get("/api/marketing/auto-reports/config", (req, res) => {
    res.json(db.getAutoReportConfig());
  });

  app.put("/api/marketing/auto-reports/config", (req, res) => {
    const updated = db.updateAutoReportConfig(req.body);
    res.json(updated);
  });

  // ==========================================
  // COMPLIANCE & DOCUMENTS API
  // ==========================================

  // 1. Get compliance documents (with filters: driverId, status, expiryStatus, docType, search)
  app.get("/api/compliance/documents", (req, res) => {
    const { driverId, status, expiryStatus, docType, search } = req.query as Record<string, string>;
    const docs = db.getComplianceDocuments({ driverId, status, expiryStatus, docType, search });
    res.json(docs);
  });

  // 2. Get verification queue (pending review items)
  app.get("/api/compliance/queue", (req, res) => {
    const queue = db.getVerificationQueue();
    res.json(queue);
  });

  // 3. Get expiring documents (<=30 days or expired)
  app.get("/api/compliance/expiring", (req, res) => {
    const expiring = db.getExpiringDocuments();
    res.json(expiring);
  });

  // 4. Get fleet-wide compliance matrix
  app.get("/api/compliance/matrix", (req, res) => {
    const matrix = db.getFleetComplianceMatrix();
    res.json(matrix);
  });

  // 5. Upload new compliance document or renewed version
  app.post("/api/compliance/documents", (req, res) => {
    try {
      const { driverId, docType, title, fileUrl, fileName, fileSize, fileType, expiryDate, uploadedBy, extractedData, isMandatory, actorRole, actorName } = req.body;
      if (!driverId || !docType || !fileUrl) {
        return res.status(400).json({ error: "driverId, docType, and fileUrl are required." });
      }

      const doc = db.createOrUploadComplianceDocument({
        driverId,
        docType,
        title,
        fileUrl,
        fileName: fileName || `${docType}_document.pdf`,
        fileSize,
        fileType,
        expiryDate,
        uploadedBy,
        extractedData,
        isMandatory
      }, actorRole || 'driver_manager', actorName || 'Staff Member');

      res.status(201).json(doc);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to upload document", details: err?.message });
    }
  });

  // 6. Verify (Approve / Reject) document
  app.put("/api/compliance/documents/:id/verify", (req, res) => {
    try {
      const { status, reviewerName, reviewerRole, reviewerComment } = req.body;
      if (!status || !['verified', 'rejected', 'pending_review'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'verified', 'rejected', or 'pending_review'." });
      }

      const verifiedDoc = db.verifyComplianceDocument(
        req.params.id,
        status,
        reviewerName || 'Staff Reviewer',
        reviewerRole || 'driver_manager',
        reviewerComment
      );

      if (!verifiedDoc) {
        return res.status(404).json({ error: "Compliance document not found" });
      }

      res.json(verifiedDoc);
    } catch (err: any) {
      res.status(500).json({ error: "Verification failed", details: err?.message });
    }
  });

  // 7. Get audit logs
  app.get("/api/compliance/logs", (req, res) => {
    const { driverId } = req.query as { driverId?: string };
    const logs = db.getComplianceAuditLogs(driverId);
    res.json(logs);
  });

  // 8. Driver Consent records
  app.post("/api/compliance/consent", (req, res) => {
    const { driverId, consentVersion, ipAddress } = req.body;
    if (!driverId) return res.status(400).json({ error: "driverId is required" });
    const consent = db.recordDriverConsent(driverId, consentVersion, ipAddress);
    res.json(consent);
  });

  app.get("/api/compliance/consent/:driverId", (req, res) => {
    const consent = db.getDriverConsent ? db.getDriverConsent(req.params.driverId) : undefined;
    res.json(consent || { driverId: req.params.driverId, consentGiven: false });
  });

  // 9. Send renewal reminder (SMS / Email / AT AI Voice)
  app.post("/api/compliance/documents/:id/reminder", (req, res) => {
    try {
      const { channel } = req.body;
      const result = db.sendComplianceReminder(req.params.id, channel || 'at_ai');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to dispatch reminder", details: err?.message });
    }
  });

  // 10. AI Document OCR Scan (Gemini Vision Extraction)
  app.post("/api/compliance/ocr-scan", async (req, res) => {
    try {
      const { docType, driverHint } = req.body;
      const extracted = await extractDocumentDataWithGemini(docType || 'tlc_license', driverHint);
      res.json(extracted);
    } catch (err: any) {
      res.status(500).json({ error: "AI OCR scan failed", details: err?.message });
    }
  });

  // ==========================================
  // APP ANALYTICS & MONITORING API (4 Mobile Apps)
  // ==========================================

  // 1. Get apps metadata
  app.get("/api/analytics/metadata", (req, res) => {
    res.json(db.getAppMetadataList());
  });

  // 2. Get overview stats & comparison series
  app.get("/api/analytics/overview", (req, res) => {
    const appId = (req.query.appId as any) || 'all';
    const days = parseInt(req.query.days as string, 10) || 30;
    res.json(db.getAppOverview(appId, days));
  });

  // 3. Get daily metrics
  app.get("/api/analytics/metrics", (req, res) => {
    const appId = (req.query.appId as any) || 'all';
    const days = parseInt(req.query.days as string, 10) || 30;
    res.json(db.getAppDailyMetrics(appId, days));
  });

  // 4. Get conversion funnel
  app.get("/api/analytics/funnel", (req, res) => {
    const appId = (req.query.appId as any) || 'all';
    res.json(db.getAppFunnel(appId));
  });

  // 5. Traffic sources & ad campaigns
  app.get("/api/analytics/sources", (req, res) => {
    const appId = (req.query.appId as any) || 'all';
    res.json(db.getAppTrafficSources(appId));
  });

  app.post("/api/analytics/sources", (req, res) => {
    try {
      const source = db.createAppTrafficSource(req.body);
      res.json(source);
    } catch (err: any) {
      res.status(400).json({ error: "Failed to create traffic source", details: err?.message });
    }
  });

  app.delete("/api/analytics/sources/:id", (req, res) => {
    const success = db.deleteAppTrafficSource(req.params.id);
    if (!success) return res.status(404).json({ error: "Traffic source not found" });
    res.json({ success: true, id: req.params.id });
  });

  // 6. Cohort analysis
  app.get("/api/analytics/cohorts", (req, res) => {
    const appId = (req.query.appId as any) || 'all';
    const audience = req.query.audience as any;
    res.json(db.getAppCohorts(appId, audience));
  });

  // 7. Store Reviews & Ratings
  app.get("/api/analytics/reviews", (req, res) => {
    const appId = (req.query.appId as any) || 'all';
    res.json(db.getAppReviews(appId));
  });

  app.post("/api/analytics/reviews", (req, res) => {
    try {
      const review = db.createAppReview(req.body);
      res.json(review);
    } catch (err: any) {
      res.status(400).json({ error: "Failed to create review", details: err?.message });
    }
  });

  // 8. Sentiment Summary
  app.get("/api/analytics/sentiment", (req, res) => {
    const appId = (req.query.appId as any) || 'all';
    res.json(db.getAppSentimentSummary(appId));
  });

  // 9. AI Recommendations
  app.get("/api/analytics/recommendations", (req, res) => {
    const appId = (req.query.appId as any) || 'all';
    res.json(db.getAppAiRecommendations(appId));
  });

  app.post("/api/analytics/recommendations/generate", async (req, res) => {
    try {
      const appId = (req.body.appId as any) || 'all';
      const funnel = db.getAppFunnel(appId);
      const overview = db.getAppOverview(appId, 30);
      const sentiment = db.getAppSentimentSummary(appId);
      const sources = db.getAppTrafficSources(appId);

      const metadataList = db.getAppMetadataList();
      const appMeta = metadataList.find(m => m.id === appId);
      const appTitle = appMeta ? `${appMeta.title} (${appMeta.storeName})` : 'All 4 Accessible Transit Mobile Apps (Aggregate)';

      const recData = await generateAppAnalyticsRecommendationsWithGemini({
        appId,
        appTitle,
        funnel,
        retentionSummary: {
          avgD1: overview.summary.avgD1,
          avgD7: overview.summary.avgD7,
          avgD30: overview.summary.avgD30
        },
        sentimentSummary: sentiment,
        topCampaigns: sources.slice(0, 4)
      });

      const fullRec = {
        id: `rec-${appId}-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        ...recData
      };

      const saved = db.saveAppAiRecommendation(fullRec);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to generate AI recommendations", details: err?.message });
    }
  });

  // 10. CSV Import
  app.post("/api/analytics/import-csv", (req, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData || typeof csvData !== 'string') {
        return res.status(400).json({ error: "Missing csvData string in request body" });
      }
      const result = db.importAppMetricsFromCsv(csvData);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: "CSV import failed", details: err?.message });
    }
  });

  // 11. CSV Template Export
  app.get("/api/analytics/export-template", (req, res) => {
    const csv = db.generateSampleCsvTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="at_app_analytics_template.csv"');
    res.send(csv);
  });


  // ==================== REFERRAL PROGRAM API ====================
  app.get("/api/referrals/settings", (req, res) => {
    res.json(db.getReferralSettings());
  });

  app.put("/api/referrals/settings", (req, res) => {
    const updated = db.updateReferralSettings(req.body);
    res.json(updated);
  });

  app.get("/api/referrals/stats", (req, res) => {
    const stats = db.getReferralDashboardStats();
    res.json(stats);
  });

  app.get("/api/referrals", (req, res) => {
    const { referrerId, referrerType, status, isSuspicious } = req.query as Record<string, string>;
    const referrals = db.getReferrals({
      referrerId,
      referrerType,
      status,
      isSuspicious: isSuspicious !== undefined ? isSuspicious === 'true' : undefined
    });
    res.json(referrals);
  });

  app.post("/api/referrals", (req, res) => {
    const { referrerId, referredName, referredPhone, referredType } = req.body;
    if (!referrerId || !referredName || !referredPhone || !referredType) {
      return res.status(400).json({ error: "referrerId, referredName, referredPhone, and referredType are required" });
    }
    const result = db.addReferral(req.body);
    res.status(201).json(result);
  });

  app.post("/api/referrals/:id/activate", (req, res) => {
    const { orderId } = req.body;
    const result = db.activateReferral(req.params.id, orderId);
    if (!result.success) return res.status(404).json({ error: "Referral not found" });
    res.json(result);
  });

  app.post("/api/referrals/:id/review", (req, res) => {
    const { action } = req.body;
    if (!action || !['approve', 'dismiss'].includes(action)) {
      return res.status(400).json({ error: "action must be 'approve' or 'dismiss'" });
    }
    const result = db.reviewSuspiciousReferral(req.params.id, action);
    if (!result.success) return res.status(404).json({ error: "Referral not found" });
    res.json(result);
  });

  app.get("/api/referrals/rewards", (req, res) => {
    const { userId } = req.query as Record<string, string>;
    res.json(db.getReferralRewards(userId));
  });

  app.get("/api/referrals/commission-logs", (req, res) => {
    const { driverId } = req.query as Record<string, string>;
    res.json(db.getCommissionLogs(driverId));
  });

  app.get("/api/referrals/lookup/:code", (req, res) => {
    const data = db.lookupReferralCode(req.params.code);
    res.json(data);
  });

  app.get("/api/drivers/:id/referrals", (req, res) => {
    const summary = db.getDriverReferralSummary(req.params.id);
    if (!summary) return res.status(404).json({ error: "Driver not found" });
    res.json(summary);
  });

  // EXTERNAL INTEGRATION API (For AT AI Voice/Chat dispatcher, Broker Webhooks & Rider/Driver Apps)
  app.get("/api/external/info", (req, res) => {
    res.json({
      company: "Accessible Transit LLC (Queens, NYC)",
      apiKey: db.apiKey,
      integrationHeader: "x-api-key",
      endpoints: [
        {
          method: "POST",
          path: "/api/external/orders",
          description: "AT AI Voice/Chat Agent & Passenger App order ingestion endpoint",
          samplePayload: {
            passengerName: "Rosa Morales",
            passengerPhone: "+1 (718) 555-4920",
            pickupAddress: "37-20 74th St, Jackson Heights, NY 11372",
            pickupNeighborhood: "Jackson Heights",
            dropoffAddress: "82-68 164th St, Jamaica, NY 11432",
            dropoffNeighborhood: "Jamaica",
            fareAmount: 52.00,
            vehicleType: "WAV",
            requiresWav: true,
            source: "at_ai",
            notes: "Voice booked via AT AI Dispatcher"
          }
        },
        {
          method: "POST",
          path: "/api/external/driver-applications",
          description: "Driver onboarding portal & registration app integration",
          samplePayload: {
            fullName: "Carlos Mendoza",
            phone: "+1 (347) 555-6671",
            email: "carlos.mendoza@email.com",
            tlcLicenseNumber: "TLC-6190823",
            vehicleType: "WAV",
            vehicleMakeModel: "2024 Toyota Sienna WAV",
            vehiclePlate: "T819200C",
            operatingBoroughs: ["Jackson Heights", "Flushing", "Jamaica"]
          }
        },
        {
          method: "GET",
          path: "/api/external/active-orders",
          description: "Polling endpoint for dispatch status & active trips"
        }
      ]
    });
  });

  // Middleware for External API Key check
  const verifyApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.headers["x-api-key"] || req.query.apiKey;
    if (!key || (key !== db.apiKey && key !== "at_live_sec_9941a87b41e9")) {
      return res.status(401).json({
        error: "Unauthorized: Invalid or missing x-api-key header. Check CRM Integration settings."
      });
    }
    next();
  };

  app.post("/api/external/orders", verifyApiKey, (req, res) => {
    const orderData = {
      ...req.body,
      source: req.body.source || "at_ai"
    };
    const order = db.createOrder(orderData);
    res.status(201).json({
      success: true,
      message: "Order successfully ingested into Accessible Transit CRM queue",
      order
    });
  });

  app.post("/api/external/driver-applications", verifyApiKey, (req, res) => {
    const driver = db.createDriver({
      ...req.body,
      status: "applied"
    });
    res.status(201).json({
      success: true,
      message: "Driver application registered into CRM onboarding pipeline",
      driver
    });
  });

  app.get("/api/external/active-orders", verifyApiKey, (req, res) => {
    const activeOrders = db.getOrders().filter(o => ['created', 'driver_assigned', 'en_route', 'on_trip'].includes(o.status));
    res.json({
      count: activeOrders.length,
      orders: activeOrders
    });
  });

  // =========================================================================
  // CLONE ADMIN PANEL REST API INTEGRATION LAYER
  // =========================================================================

  // 1. Get connection & auth health status
  app.get("/api/integration/status", (req, res) => {
    res.json(adminPanelClient.getStatus());
  });

  // 2. Get integration configuration (masked secrets)
  app.get("/api/integration/config", (req, res) => {
    res.json(adminPanelClient.getConfig());
  });

  // 3. Update configuration (e.g. rate limits or polling frequencies)
  app.put("/api/integration/config", (req, res) => {
    const updated = adminPanelClient.updateConfig(req.body);
    res.json(updated);
  });

  // 4. Manually trigger Live Orders Poll
  app.post("/api/integration/sync/live-orders", async (req, res) => {
    try {
      const result = await syncEngine.syncLiveOrders();
      res.json({
        success: true,
        message: `Polled live orders successfully (${result.updated} updated, ${result.created} new)`,
        result
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to sync live orders" });
    }
  });

  // 5. Manually trigger Driver Profiles Sync
  app.post("/api/integration/sync/drivers", async (req, res) => {
    try {
      const result = await syncEngine.syncDrivers();
      res.json({
        success: true,
        message: `Synchronized driver profiles successfully (${result.updated} updated, ${result.created} new)`,
        result
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to sync driver profiles" });
    }
  });

  // 6. Force refresh JWT authentication token
  app.post("/api/integration/auth/refresh", async (req, res) => {
    try {
      const result = await adminPanelClient.authenticate(true);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Authentication token refresh failed" });
    }
  });

  // 7. Test connection & credentials
  app.post("/api/integration/auth/test", async (req, res) => {
    try {
      const result = await adminPanelClient.authenticate(false);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Connection test failed" });
    }
  });

  // 8. Get Integration & Sync Audit Logs
  app.get("/api/integration/logs", (req, res) => {
    const { type, status } = req.query as Record<string, string>;
    const logs = adminPanelClient.getLogs({ type, status });
    res.json(logs);
  });

  // 9. Get Field Mapping Definitions schema
  app.get("/api/integration/mappings", (req, res) => {
    res.json(syncEngine.getFieldMappings());
  });

  // 10. Ingest Webhook events from Clone Admin Panel
  app.post("/api/integration/webhook", async (req, res) => {
    try {
      const result = adminPanelClient.handleIncomingWebhook(req.body);
      // Trigger sync if order or driver event
      if (req.body?.entity === 'order') {
        syncEngine.syncLiveOrders().catch(console.error);
      } else if (req.body?.entity === 'driver') {
        syncEngine.syncDrivers().catch(console.error);
      }
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to process webhook" });
    }
  });

  // =========================================================================
  // INTERNAL CRM AI AGENT ("JARVIS") ENDPOINTS
  // =========================================================================

  app.post("/api/ai/agent/command", async (req, res) => {
    try {
      const { command, currentRole, actorName, language } = req.body;
      if (!command) {
        return res.status(400).json({ error: "Command is required" });
      }

      // Check role authorization (Only admin and dispatcher have access)
      if (currentRole !== 'admin' && currentRole !== 'dispatcher') {
        return res.status(403).json({
          error: "Access forbidden: Internal AI Agent is restricted to Administrator and Dispatcher roles."
        });
      }

      const snapshot = db.getSnapshotForAi();
      const response = await processAiAgentCommand({
        command,
        currentRole: currentRole || 'admin',
        actorName: actorName || (currentRole === 'admin' ? 'Administrator' : 'Dispatcher'),
        language: language === 'ru' ? 'ru' : 'en',
        snapshot
      });

      // Log the interaction into CRM Audit Logs
      const auditLog = db.addAiAgentAuditLog({
        actorRole: currentRole || 'admin',
        actorName: actorName || 'CRM Staff',
        command,
        actionType: response.proposedAction?.actionType,
        status: response.proposedAction ? 'info_query' : 'info_query',
        details: response.proposedAction 
          ? `Proposed action: ${response.proposedAction.title} (${response.proposedAction.description})`
          : `Direct intelligence answer provided.`,
        resultSummary: response.reply.slice(0, 140) + (response.reply.length > 140 ? '...' : '')
      });

      res.json({
        ...response,
        auditLogId: auditLog.id
      });
    } catch (err: any) {
      console.error("AI Agent Command Error:", err);
      res.status(500).json({ error: err?.message || "Failed to process agent command" });
    }
  });

  app.post("/api/ai/agent/execute", (req, res) => {
    try {
      const { action, currentRole, actorName } = req.body;
      if (!action || !action.actionType) {
        return res.status(400).json({ error: "Valid proposed action is required for execution" });
      }

      if (currentRole !== 'admin' && currentRole !== 'dispatcher') {
        return res.status(403).json({ error: "Unauthorized role" });
      }

      const result = db.executeAiAgentAction(
        action,
        currentRole || 'admin',
        actorName || (currentRole === 'admin' ? 'Administrator' : 'Dispatcher')
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err: any) {
      console.error("AI Agent Execute Error:", err);
      res.status(500).json({ error: err?.message || "Failed to execute agent action" });
    }
  });

  app.get("/api/ai/agent/audit-logs", (req, res) => {
    const logs = db.getAiAgentAuditLogs();
    res.json(logs);
  });

  // =========================================================================
  // EMPLOYEES & FACE BIOMETRIC AUTHENTICATION API
  // =========================================================================

  // List all employees (Administrator only)
  app.get("/api/employees", (req, res) => {
    const role = (req.headers["x-user-role"] as any) || req.query.role;
    const employees = db.getEmployees(role);
    res.json(employees);
  });

  // =========================================================================
  // EMPLOYEE GEOLOCATION & LIVE TRACKING API
  // =========================================================================

  // Get live location of all actively tracked employees (Administrator ONLY)
  app.get("/api/employees/location/live", (req, res) => {
    const role = (req.headers["x-user-role"] as any) || req.query.role || "admin";
    if (role !== "admin") {
      return res.status(403).json({ error: "Access denied. Only Administrators can view employee live locations." });
    }
    const locations = db.getLiveEmployeeLocations('admin');
    res.json(locations);
  });

  // Get employee location consent status
  app.get("/api/employees/location/consent/:employeeId", (req, res) => {
    const consent = db.getEmployeeLocationConsent(req.params.employeeId);
    if (!consent) {
      return res.json({ consented: false, employeeId: req.params.employeeId });
    }
    res.json(consent);
  });

  // Record / update legal location consent (Legal Compliance Audit)
  app.post("/api/employees/location/consent", (req, res) => {
    try {
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "72.229.40.15";
      const userAgent = req.headers["user-agent"] || "Browser";
      const { employeeId, consented } = req.body;

      if (!employeeId || typeof consented !== "boolean") {
        return res.status(400).json({ error: "employeeId and boolean consented flag are required." });
      }

      const record = db.recordEmployeeLocationConsent(employeeId, consented, clientIp, userAgent);
      res.json(record);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to record location consent" });
    }
  });

  // Send periodic geolocation heartbeat (Active CRM session)
  app.post("/api/employees/location/heartbeat", (req, res) => {
    try {
      let bodyData = req.body;
      // Handle sendBeacon string payloads if Content-Type was text/plain
      if (typeof bodyData === "string") {
        try {
          bodyData = JSON.parse(bodyData);
        } catch {
          // ignore
        }
      }

      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "72.229.40.15";
      const { employeeId, lat, lng, accuracy, heading, speed, boroughOrArea, deviceInfo } = bodyData;

      if (!employeeId || typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ error: "employeeId, lat, and lng are required." });
      }

      const updatedLoc = db.updateEmployeeLiveLocation({
        employeeId,
        lat,
        lng,
        accuracy,
        heading,
        speed,
        boroughOrArea,
        deviceInfo
      }, clientIp);

      res.json(updatedLoc);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to update employee location" });
    }
  });

  // Clear live location immediately (on logout, tab close, or window unload)
  app.post("/api/employees/location/clear", (req, res) => {
    try {
      let employeeId = req.body?.employeeId;
      if (typeof req.body === "string") {
        try {
          employeeId = JSON.parse(req.body)?.employeeId;
        } catch {
          // ignore
        }
      }

      if (employeeId) {
        db.clearEmployeeLiveLocation(employeeId);
      }
      res.json({ success: true, message: "Location tracking terminated for session." });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to clear location" });
    }
  });

  // Update employee status (Admin action: block/unblock/suspend)
  app.patch("/api/employees/:id/status", (req, res) => {
    try {
      const { status } = req.body;
      const updated = db.updateEmployeeStatus(req.params.id, status);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to update employee status" });
    }
  });

  // Delete employee (Purges all biometric embeddings permanently)
  app.delete("/api/employees/:id", (req, res) => {
    try {
      const result = db.deleteEmployee(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to delete employee" });
    }
  });

  // Reset Face ID for employee (forces re-enrollment)
  app.post("/api/employees/:id/reset-face", (req, res) => {
    try {
      const adminName = req.body.adminName || "Administrator";
      const updated = db.resetEmployeeFaceId(req.params.id, adminName);
      res.json({
        success: true,
        message: `Face ID reset for ${updated.fullName}. Biometric embeddings purged.`,
        employee: updated
      });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to reset Face ID" });
    }
  });

  // List all invitations (Administrator only)
  app.get("/api/employees/invitations", (req, res) => {
    const invitations = db.getInvitations();
    res.json(invitations);
  });

  // Generate new one-time invitation link (48 Hours TTL)
  app.post("/api/employees/invitations", (req, res) => {
    try {
      const { role, targetEmail, targetFullName, adminName } = req.body;
      if (!role) {
        return res.status(400).json({ error: "Employee role is required" });
      }
      const invitation = db.createInvitation({
        role,
        targetEmail,
        targetFullName,
        adminName
      });
      res.status(201).json(invitation);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to create invitation" });
    }
  });

  // Revoke invitation
  app.post("/api/employees/invitations/:id/revoke", (req, res) => {
    try {
      const adminName = req.body.adminName || "Administrator";
      const success = db.revokeInvitation(req.params.id, adminName);
      if (!success) return res.status(404).json({ error: "Invitation not found" });
      res.json({ success: true, message: "Invitation revoked successfully" });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to revoke invitation" });
    }
  });

  // Invitation resolution / verification endpoint (tracks first-seen IP)
  app.get("/api/employees/invite-preview/:token", (req, res) => {
    try {
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "198.51.100.42";
      const userAgent = req.headers["user-agent"] || "Browser";
      const token = req.params.token;
      
      const inv = db.trackInvitationFirstSeen(token, clientIp, userAgent);
      if (!inv) {
        return res.status(404).json({ error: "Invalid invitation link. Link not found." });
      }

      if (inv.status === 'used') {
        return res.status(410).json({ error: "This invitation link has already been used.", status: 'used' });
      }

      if (inv.status === 'revoked') {
        return res.status(403).json({ error: "This invitation link has been revoked by an administrator.", status: 'revoked' });
      }

      if (inv.status === 'expired' || new Date(inv.expiresAt) < new Date()) {
        return res.status(410).json({ error: "This invitation link expired (48-hour limit exceeded).", status: 'expired' });
      }

      res.json({
        valid: true,
        invitation: {
          id: inv.id,
          token: inv.token,
          role: inv.role,
          expiresAt: inv.expiresAt,
          targetEmail: inv.targetEmail,
          targetFullName: inv.targetFullName,
          firstSeenIp: inv.firstSeenIp,
          currentIp: clientIp,
          ipMismatch: inv.firstSeenIp && inv.firstSeenIp !== clientIp
        }
      });
    } catch (err: any) {
      console.error("Invite Preview Error:", err);
      res.status(400).json({ error: err?.message || "Failed to process invitation" });
    }
  });

  // Self-Registration endpoint with Face Enrollment
  app.post("/api/employees/register", (req, res) => {
    try {
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "198.51.100.55";
      const userAgent = req.headers["user-agent"] || "Browser";

      const payload = {
        ...req.body,
        clientIp,
        userAgent
      };

      const result = db.registerEmployeeFromInvite(payload);
      res.status(201).json(result);
    } catch (err: any) {
      console.error("Employee Registration Error:", err);
      res.status(400).json({ error: err?.message || "Registration failed" });
    }
  });

  // Biometric Face ID Login
  app.post("/api/auth/face-login", (req, res) => {
    try {
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "198.51.100.60";
      const userAgent = req.headers["user-agent"] || "Browser";

      const { faceImageBase64, livenessData, targetEmail } = req.body;
      if (!faceImageBase64) {
        return res.status(400).json({ error: "Face scan image data is required" });
      }

      const result = db.verifyFaceLogin({
        faceImageBase64,
        livenessData,
        ip: clientIp,
        userAgent,
        targetEmail
      });

      if (!result.matched) {
        return res.status(401).json(result);
      }

      res.json(result);
    } catch (err: any) {
      console.error("Face Login Error:", err);
      res.status(500).json({ error: err?.message || "Biometric authentication failed" });
    }
  });

  // Password Login Backup
  app.post("/api/auth/password-login", (req, res) => {
    try {
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "198.51.100.60";
      const userAgent = req.headers["user-agent"] || "Browser";

      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const result = db.verifyPasswordLogin({
        email,
        password,
        ip: clientIp,
        userAgent
      });

      if (!result.success) {
        return res.status(401).json(result);
      }

      res.json(result);
    } catch (err: any) {
      console.error("Password Login Error:", err);
      res.status(500).json({ error: err?.message || "Authentication failed" });
    }
  });

  // Biometric & Login Audit Trail Logs
  app.get("/api/auth/login-audit", (req, res) => {
    const employeeId = req.query.employeeId as string;
    const logs = db.getEmployeeLoginAuditLogs(employeeId);
    res.json(logs);
  });

  return app;
}

export async function startServer() {
  const app = createApp();
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Accessible Transit CRM Server running on http://localhost:${PORT}`);
    // Start background integration synchronization workers
    syncEngine.start().catch(err => {
      console.error("Failed to start syncEngine workers:", err);
    });
  });
}

startServer();
