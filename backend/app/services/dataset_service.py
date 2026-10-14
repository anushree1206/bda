import os
import csv
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

class DatasetService:
    def __init__(self, dataset_path: Optional[str] = None):
        if dataset_path is None:
            full_path = "data/household_power_consumption.txt"
            sample_path = "data/household_power_consumption_sample.txt"
            self.dataset_path = full_path if os.path.exists(full_path) else sample_path
        else:
            self.dataset_path = dataset_path
        self._cached_readings: Optional[List[Dict[str, Any]]] = None

    def check_dataset_exists(self) -> bool:
        return os.path.exists(self.dataset_path) and os.path.getsize(self.dataset_path) > 0

    def parse_raw_line(self, line_or_parts) -> Optional[Dict[str, Any]]:
        """
        Parses a single line from the UCI household power consumption dataset.
        Format: Date;Time;Global_active_power;Global_reactive_power;Voltage;Global_intensity;Sub_metering_1;Sub_metering_2;Sub_metering_3
        Date format: dd/mm/yyyy
        Time format: hh:mm:ss
        Missing value marker: '?'
        """
        if isinstance(line_or_parts, str):
            parts = [p.strip() for p in line_or_parts.strip().split(";")]
        else:
            parts = [str(p).strip() for p in line_or_parts]

        if len(parts) < 9 or parts[0] in ["Date", ""]:
            return None

        date_str, time_str = parts[0], parts[1]
        
        # Parse timestamp safely
        try:
            dt = datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M:%S")
            iso_timestamp = dt.isoformat()
        except ValueError:
            try:
                # Alternative ISO format if pre-processed
                dt = datetime.fromisoformat(f"{date_str}T{time_str}")
                iso_timestamp = dt.isoformat()
            except Exception:
                return None

        def parse_float(val: str) -> Optional[float]:
            if val in ["?", "", "NA", "null", "None"]:
                return None
            try:
                return float(val)
            except ValueError:
                return None

        active_power = parse_float(parts[2])
        reactive_power = parse_float(parts[3])
        voltage = parse_float(parts[4])
        intensity = parse_float(parts[5])
        sub1 = parse_float(parts[6])
        sub2 = parse_float(parts[7])
        sub3 = parse_float(parts[8])

        return {
            "timestamp": iso_timestamp,
            "meter_id": "household_001",
            "global_active_power_kw": active_power, # Target variable in kW
            "global_reactive_power_kvar": reactive_power,
            "voltage_v": voltage,
            "global_intensity_a": intensity,
            "sub_metering_1_wh": sub1,
            "sub_metering_2_wh": sub2,
            "sub_metering_3_wh": sub3,
            "is_valid": active_power is not None,
            "source": "uci_household_smart_meter"
        }

    def load_dataset(self, limit: Optional[int] = None, force_reload: bool = False) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Loads and parses the dataset, handling '?' missing markers without silent conversion to zero.
        """
        if self._cached_readings and not force_reload and limit is None:
            return self._cached_readings, self.get_stats()

        if not self.check_dataset_exists():
            return [], {"error": "Dataset file not found at " + self.dataset_path}

        readings = []
        total_lines = 0
        valid_records = 0
        missing_power_records = 0

        with open(self.dataset_path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                if not line.strip():
                    continue
                total_lines += 1
                if total_lines == 1 and ("Date" in line or "date" in line):
                    continue # Skip header

                parsed = self.parse_raw_line(line)
                if parsed:
                    if parsed["is_valid"]:
                        valid_records += 1
                    else:
                        missing_power_records += 1
                    readings.append(parsed)

                if limit and len(readings) >= limit:
                    break

        # Sort chronologically
        readings.sort(key=lambda x: x["timestamp"])

        stats = {
            "total_lines_read": total_lines,
            "total_parsed": len(readings),
            "valid_records": valid_records,
            "missing_power_records": missing_power_records,
            "missing_percentage": round((missing_power_records / max(1, len(readings))) * 100, 2),
            "start_time": readings[0]["timestamp"] if readings else None,
            "end_time": readings[-1]["timestamp"] if readings else None,
        }

        if limit is None:
            self._cached_readings = readings

        return readings, stats

    def get_stats(self) -> Dict[str, Any]:
        if not self._cached_readings:
            self.load_dataset()
        if not self._cached_readings:
            return {"status": "empty"}
        
        valid = [r for r in self._cached_readings if r["is_valid"]]
        return {
            "total_records": len(self._cached_readings),
            "valid_records": len(valid),
            "start_timestamp": self._cached_readings[0]["timestamp"],
            "end_timestamp": self._cached_readings[-1]["timestamp"],
            "data_source": "UCI Individual Household Electric Power Consumption Dataset (used as building proxy)"
        }

dataset_service = DatasetService()
