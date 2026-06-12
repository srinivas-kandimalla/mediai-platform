import prisma from '../config/db.js';
import logger from '../utils/logger.js';

export const listResources = async (req, res, next) => {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { resourceType: 'asc' },
    });

    res.status(200).json({ success: true, data: resources });
  } catch (err) {
    logger.error('List resources error:', err);
    next(err);
  }
};

export const updateResourceUnits = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { totalUnits, availableUnits } = req.body;

    if (totalUnits === undefined && availableUnits === undefined) {
      return res.status(400).json({ success: false, message: 'totalUnits or availableUnits must be provided' });
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        totalUnits: totalUnits !== undefined ? parseInt(totalUnits) : undefined,
        availableUnits: availableUnits !== undefined ? parseInt(availableUnits) : undefined,
      },
    });

    logger.info(`Resource inventory updated: ${id} - Available: ${updated.availableUnits}/${updated.totalUnits}`);

    res.status(200).json({ success: true, message: 'Resource inventory updated', data: updated });
  } catch (err) {
    logger.error('Update resource units error:', err);
    next(err);
  }
};

export const getResourceForecast = async (req, res, next) => {
  try {
    // Generate simple prediction metrics based on current bed occupancies and patient states
    const activeCriticalAlerts = await prisma.alert.count({ where: { isResolved: false, alertType: 'CRITICAL' } });
    const icuOccupied = await prisma.bed.count({ where: { isOccupied: true, wardType: 'ICU' } });

    // Mock predictions based on active telemetry indicators
    const ventilatorDemand = Math.max(2, Math.round(icuOccupied * 0.4 + activeCriticalAlerts * 0.8));
    const oxygenDemand = Math.max(5, Math.round(icuOccupied * 0.8 + activeCriticalAlerts * 1.2));
    const generalEquipDemand = Math.max(10, Math.round(icuOccupied * 1.2 + activeCriticalAlerts * 0.5));

    const forecasts = [
      { resourceType: 'VENTILATOR', currentRequired: ventilatorDemand, forecastedIncreasePercentage: activeCriticalAlerts > 0 ? 25.0 : 5.0 },
      { resourceType: 'OXYGEN', currentRequired: oxygenDemand, forecastedIncreasePercentage: activeCriticalAlerts > 0 ? 40.0 : 12.0 },
      { resourceType: 'EQUIPMENT', currentRequired: generalEquipDemand, forecastedIncreasePercentage: 15.0 },
    ];

    res.status(200).json({ success: true, data: forecasts });
  } catch (err) {
    logger.error('Get resource forecast error:', err);
    next(err);
  }
};
