import math
from datetime import datetime, timedelta
from typing import List, Tuple
from .entities import Checkpoint

EARTH_RADIUS_MILES = 3958.8


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_MILES * c


def interpolate_coord(
    start_point: Tuple[float, float],
    end_point: Tuple[float, float],
    fraction: float
) -> Tuple[float, float]:
    lat = start_point[0] + (end_point[0] - start_point[0]) * fraction
    lon = start_point[1] + (end_point[1] - start_point[1]) * fraction
    return (lat, lon)


def sample_route_checkpoints(
    coordinates: List[List[float]],
    departure_time: datetime,
    total_duration_seconds: float,
    interval_miles: float = 25.0
) -> List[Checkpoint]:
    if not coordinates:
        return []

    points: List[Tuple[float, float]] = [(coord[1], coord[0]) for coord in coordinates]

    cumulative_distances: List[float] = [0.0]
    total_dist = 0.0

    for point_index in range(1, len(points)):
        dist = haversine_miles(
            points[point_index - 1][0],
            points[point_index - 1][1],
            points[point_index][0],
            points[point_index][1]
        )
        total_dist += dist
        cumulative_distances.append(total_dist)

    if total_dist == 0.0:
        return [Checkpoint(index=0, mile=0.0, latitude=points[0][0], longitude=points[0][1], eta=departure_time)]

    checkpoints: List[Checkpoint] = [
        Checkpoint(
            index=0,
            mile=0.0,
            latitude=points[0][0],
            longitude=points[0][1],
            eta=departure_time
        )
    ]

    target_mile = interval_miles
    current_seg = 0

    while target_mile < total_dist:
        while (current_seg < len(cumulative_distances) - 1 and
               cumulative_distances[current_seg + 1] < target_mile):
            current_seg += 1

        seg_start_dist = cumulative_distances[current_seg]
        seg_end_dist = cumulative_distances[current_seg + 1]
        seg_len = seg_end_dist - seg_start_dist

        fraction = (target_mile - seg_start_dist) / seg_len if seg_len > 0 else 0.0

        start_point = points[current_seg]
        end_point = points[current_seg + 1]
        interp_lat, interp_lon = interpolate_coord(start_point, end_point, fraction)

        progress_ratio = target_mile / total_dist
        elapsed_seconds = total_duration_seconds * progress_ratio
        eta = departure_time + timedelta(seconds=elapsed_seconds)

        checkpoints.append(
            Checkpoint(
                index=len(checkpoints),
                mile=target_mile,
                latitude=interp_lat,
                longitude=interp_lon,
                eta=eta
            )
        )

        target_mile += interval_miles

    final_eta = departure_time + timedelta(seconds=total_duration_seconds)
    checkpoints.append(
        Checkpoint(
            index=len(checkpoints),
            mile=total_dist,
            latitude=points[-1][0],
            longitude=points[-1][1],
            eta=final_eta
        )
    )

    return checkpoints
