import EventService from '../models/EventService.js';

export const getServices = async (req, res) => {
  try {
    const services = await EventService.find({ userId: req.user.id, eventId: req.params.eventId }).sort({ createdAt: -1 });
    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving services' });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, description, defaultUnitPrice, defaultQuantity, unitLabel } = req.body;
    if (!name || !name.trim()) {
      return res.status(422).json({ success: false, message: 'Service name is required' });
    }

    const service = await EventService.create({
      userId: req.user.id,
      eventId: req.params.eventId,
      name: name.trim(),
      description: description || '',
      defaultUnitPrice: defaultUnitPrice || 0,
      defaultQuantity: defaultQuantity || 1,
      unitLabel: unitLabel || ''
    });
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error creating service' });
  }
};

export const updateService = async (req, res) => {
  try {
    const { name, description, defaultUnitPrice, defaultQuantity, unitLabel, isActive } = req.body;
    const service = await EventService.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (name !== undefined) service.name = name.trim();
    if (description !== undefined) service.description = description.trim();
    if (defaultUnitPrice !== undefined) service.defaultUnitPrice = defaultUnitPrice;
    if (defaultQuantity !== undefined) service.defaultQuantity = defaultQuantity;
    if (unitLabel !== undefined) service.unitLabel = unitLabel.trim();
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating service' });
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await EventService.findOne({ _id: req.params.id, userId: req.user.id });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await EventService.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting service' });
  }
};
