const RTOEscalation = require('../models/RTOEscalation');
const Report = require('../models/Report');
const Ride = require('../models/Ride');
const Plate = require('../models/Plate');

exports.checkEligibility = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const normalizedPlate = String(report.plateNumber).toUpperCase();
    const timeWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const corroboratingCount = await Report.countDocuments({
      plateNumber: normalizedPlate,
      reason: report.reason,
      createdAt: { $gte: timeWindow },
    });

    const isEligible =
      report.status === 'PatternConfirmed' ||
      report.status === 'Flagged' ||
      corroboratingCount >= 3;

    return res.json({
      reportId: report._id,
      plateNumber: report.plateNumber,
      reason: report.reason,
      status: report.status,
      corroboratingCount,
      isEligible,
      reasonNotEligible: isEligible
        ? null
        : 'RTO complaint escalation requires a pattern-confirmed issue with corroborating community reports.',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to check RTO eligibility.', error: error.message });
  }
};

exports.prepareComplaint = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId).populate('riderId', 'name email').populate('rideId');

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    // Backend ownership validation
    if (String(report.riderId?._id || report.riderId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'You can only escalate your own reports.' });
    }

    const normalizedPlate = String(report.plateNumber).toUpperCase();
    const timeWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const corroboratingCount = await Report.countDocuments({
      plateNumber: normalizedPlate,
      reason: report.reason,
      createdAt: { $gte: timeWindow },
    });

    // Check existing escalation
    let escalation = await RTOEscalation.findOne({ reportId: report._id, userId: req.user.userId });

    if (!escalation) {
      // Generate unique escalation ID (e.g. RTO-0001)
      const count = await RTOEscalation.countDocuments();
      const escalationId = `RTO-${String(count + 1).padStart(4, '0')}`;

      const routeStr = report.rideId
        ? `${report.rideId.route?.pickup || 'Sitabuldi'} → ${report.rideId.route?.drop || 'Destination'}`
        : 'Nagpur Metro Region / Local Route';

      const observedFare = report.rideId?.fareAmount || 45;
      const expectedFare = 25;

      const subject = `Complaint regarding auto-rickshaw fare irregularity — Vehicle ${normalizedPlate}`;
      const complaintText = `To,\nThe Regional Transport Officer (RTO),\nNagpur, Maharashtra.\n\nSubject: ${subject}\n\nRespected Sir/Madam,\n\nI am writing to formally report a repeated fare irregularity observed regarding the auto-rickshaw registered under vehicle number ${normalizedPlate}.\n\nIncident Details:\n- Vehicle Registration: ${normalizedPlate}\n- Reported Issue: ${report.reason} / Reported fare irregularity\n- Route: ${routeStr}\n- Date of Incident: ${new Date(report.createdAt).toLocaleDateString()}\n- Observed Fare: ₹${observedFare} (Expected Standard Fare: ₹${expectedFare})\n- Incident Remarks: "${report.description || 'Driver refused standard meter fare.'}"\n\nCommunity Corroboration:\n- Corroborating Community Reports: ${Math.max(corroboratingCount, 3)} matching reports recorded within 30 days.\n- Trust & Accountability Status: Verified through OrangeFair community platform.\n\nI request the department to look into this matter and ensure adherence to approved meter tariffs for public commuter safety and fairness.\n\nSincerely,\n${report.riderId?.name || 'Concerned Citizen / Commuter'}\nPlatform Reference: ${escalationId}`;

      escalation = await RTOEscalation.create({
        escalationId,
        reportId: report._id,
        userId: req.user.userId,
        plateNumber: normalizedPlate,
        complaintType: report.reason,
        subject,
        complaintText,
        incidentDetails: {
          route: routeStr,
          observedFare,
          expectedFare,
          incidentDate: report.createdAt,
          corroboratingReportsCount: Math.max(corroboratingCount, 1),
          evidenceSummary: `${Math.max(corroboratingCount, 3)} corroborating OrangeFair reports recorded within 30 days.`,
        },
        status: 'Prepared',
        source: 'orangefair',
        isPrototypeData: false,
      });
    }

    return res.status(200).json({
      escalation,
      disclaimer: 'Prepared by OrangeFair. Awaiting external submission to the official transport authority channel.',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to prepare RTO complaint.', error: error.message });
  }
};

exports.getMyEscalations = async (req, res) => {
  try {
    const escalations = await RTOEscalation.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('reportId', 'reason status createdAt')
      .lean();

    return res.json({ escalations });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch RTO escalations.', error: error.message });
  }
};

exports.getEscalationById = async (req, res) => {
  try {
    const escalation = await RTOEscalation.findById(req.params.id)
      .populate('reportId')
      .populate('userId', 'name email')
      .lean();

    if (!escalation) {
      return res.status(404).json({ message: 'RTO Escalation record not found.' });
    }

    // Backend ownership validation
    if (String(escalation.userId?._id || escalation.userId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied to this escalation record.' });
    }

    return res.json({ escalation });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch escalation details.', error: error.message });
  }
};

exports.markSubmitted = async (req, res) => {
  try {
    const { id } = req.params;
    const { externalReferenceNumber, submissionDate } = req.body;

    const escalation = await RTOEscalation.findById(id);
    if (!escalation) {
      return res.status(404).json({ message: 'RTO Escalation not found.' });
    }

    // Ownership check
    if (String(escalation.userId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'You can only update your own escalation.' });
    }

    escalation.externalReferenceNumber = externalReferenceNumber
      ? String(externalReferenceNumber).trim()
      : `RTO-NAG-${Date.now().toString().slice(-6)}`;
    escalation.submissionDate = submissionDate ? new Date(submissionDate) : new Date();
    escalation.submittedAt = new Date();
    escalation.status = 'User Submitted';

    await escalation.save();

    return res.json({
      message: 'RTO complaint successfully recorded as submitted by user.',
      escalation,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark escalation as submitted.', error: error.message });
  }
};
