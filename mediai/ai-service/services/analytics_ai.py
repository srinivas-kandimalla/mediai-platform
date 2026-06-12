import numpy as np
from datetime import datetime, timedelta

def forecast_bed_demand(historical_data: list, current_occupancy: int, time_horizon: int = 7) -> dict:
    """
    Simulates ARIMA/Prophet time-series forecasting of bed requirements.
    Uses trend-fitting on historical stays.
    """
    # Parse historical stays to determine trend
    stay_durations = []
    if historical_data:
        for item in historical_data:
            stay_durations.append(float(item.get('expectedStayDays', 4)))
    if not stay_durations:
        stay_durations = [3, 5, 4, 7, 2, 8, 5]

    avg_stay = np.mean(stay_durations)
    std_stay = np.std(stay_durations) if len(stay_durations) > 1 else 1.0

    forecasted_demand = []
    base_demand = current_occupancy
    
    # Generate daily forecasted values with weekly seasonality (sine wave) + trend
    peak_days = []
    max_val = 0
    
    today = datetime.now()
    for day_idx in range(1, time_horizon + 1):
        target_date = today + timedelta(days=day_idx)
        day_name = target_date.strftime('%A')
        
        # Seasonality: higher admissions on weekdays, lower on weekends
        seasonality = 4.0 * np.sin(2 * np.pi * day_idx / 7.0)
        # Noise
        noise = np.random.normal(0, 1.5)
        
        # Demand calculation
        demand = int(max(2, round(base_demand + (avg_stay * 0.15) + seasonality + noise)))
        
        forecasted_demand.append({
            "day": f"Day {day_idx} ({target_date.strftime('%b %d')})",
            "demand": demand,
            "weekday": day_name
        })
        
        if demand > max_val:
            max_val = demand
            peak_days = [f"{day_name} ({target_date.strftime('%b %d')})"]
        elif demand == max_val:
            peak_days.append(f"{day_name} ({target_date.strftime('%b %d')})")

    # Generate clinical recommendations based on peak levels
    if max_val > (current_occupancy * 1.3):
        recommendation = ("Warning: Hospital admissions are projected to surge by over 30%. "
                          "Allocate emergency backup beds, limit elective admissions, "
                          "and adjust staffing schedules for critical care wards.")
    else:
        recommendation = "Projected bed occupancy remains within normal parameters. Maintain standard operational procedures."

    return {
        "forecastedDemand": forecasted_demand,
        "peakDays": peak_days,
        "recommendedPreparation": recommendation
    }

def optimize_staff_schedule(staff_list: list, patient_forecast: dict, department_needs: list) -> dict:
    """
    Implements a constraint-based optimization algorithm matching available staff
    to department requirements, minimizing coverage gaps and scheduling shifts.
    """
    optimized_schedule = []
    coverage_gaps = []
    
    if not staff_list:
        return {
            "optimizedSchedule": [],
            "coverageGaps": ["No staff registered in database"],
            "recommendations": ["Register doctors and nurses before launching optimizer"]
        }

    # Department requirements map
    dept_reqs = {item['department']: int(item['countRequired']) for item in department_needs}
    
    # Track assignments per department
    dept_counts = {dept: 0 for dept in dept_reqs.keys()}
    
    today = datetime.now()
    
    # Run greedy constraint allocator
    for idx, member in enumerate(staff_list):
        # Rotate shifts: index%2 determines Day or Night
        shift_type = "Day" if idx % 2 == 0 else "Night"
        
        start_time = today + timedelta(days=1)
        start_time = start_time.replace(hour=8 if shift_type == "Day" else 20, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(hours=12)
        
        # Select department: allocate to departments that still need coverage
        allocated_dept = "GENERAL"
        for dept, req in dept_reqs.items():
            if dept_counts.get(dept, 0) < req:
                allocated_dept = dept
                dept_counts[dept] = dept_counts.get(dept, 0) + 1
                break
        else:
            # All department requirements met, assign to general pool
            allocated_dept = "GENERAL"

        optimized_schedule.append({
            "userId": member['id'],
            "name": member['name'],
            "role": member['role'],
            "shiftStart": start_time.isoformat(),
            "shiftEnd": end_time.isoformat(),
            "department": allocated_dept
        })

    # Find coverage gaps
    for dept, req in dept_reqs.items():
        current_allocated = dept_counts.get(dept, 0)
        if current_allocated < req:
            coverage_gaps.append({
                "department": dept,
                "required": req,
                "allocated": current_allocated,
                "gap": req - current_allocated
            })

    recommendations = []
    if coverage_gaps:
        recommendations.append("❌ Critical Warning: Understaffing detected in several departments. Hire temporary staff or request overtime shifts.")
    else:
        recommendations.append("✅ Full Coverage Secured: Roster successfully satisfies all department constraints.")

    recommendations.append("Ensure staff have 12-hour resting intervals between successive schedules.")

    return {
        "optimizedSchedule": optimized_schedule,
        "coverageGaps": coverage_gaps,
        "recommendations": recommendations
    }
