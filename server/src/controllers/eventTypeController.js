import EventType from '../models/EventType.js';
import Bill from '../models/Bill.js';

export const getEventTypes = async (req, res) => {
  try {
    const events = await EventType.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving event types' });
  }
};

export const createEventType = async (req, res) => {
  try {
    const { name, tamilName, logo, description, defaultVenue } = req.body;
    if (!name || !name.trim()) {
      return res.status(422).json({ success: false, message: 'Event name is required' });
    }
    
    const existing = await EventType.findOne({ userId: req.user.id, name: name.trim() });
    if (existing) {
      return res.status(422).json({ success: false, message: 'Event name already exists' });
    }

    const event = await EventType.create({
      userId: req.user.id,
      name: name.trim(),
      tamilName: tamilName ? tamilName.trim() : '',
      logo: logo || '',
      description: description || '',
      defaultVenue: defaultVenue || ''
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error creating event type' });
  }
};

export const updateEventType = async (req, res) => {
  try {
    const { name, tamilName, logo, description, defaultVenue, isActive } = req.body;
    const event = await EventType.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event type not found' });
    }

    if (name && name.trim() !== event.name) {
      const existing = await EventType.findOne({ userId: req.user.id, name: name.trim() });
      if (existing) {
        return res.status(422).json({ success: false, message: 'Event name already exists' });
      }
      event.name = name.trim();
    }
    
    if (tamilName !== undefined) event.tamilName = tamilName.trim();
    if (logo !== undefined) event.logo = logo;
    if (description !== undefined) event.description = description.trim();
    if (defaultVenue !== undefined) event.defaultVenue = defaultVenue.trim();
    if (isActive !== undefined) event.isActive = isActive;

    await event.save();
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating event type' });
  }
};

export const deleteEventType = async (req, res) => {
  try {
    const event = await EventType.findOne({ _id: req.params.id, userId: req.user.id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event type not found' });
    }

    // Check if referenced by bills
    const count = await Bill.countDocuments({ userId: req.user.id, eventType: event.name });
    if (count > 0) {
      // Disable instead of delete to preserve history
      event.isActive = false;
      await event.save();
      return res.json({ success: true, message: 'Event type disabled because it is used in existing bills.', data: event });
    }

    await EventType.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Event type deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting event type' });
  }
};
