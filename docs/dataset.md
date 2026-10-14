# Dataset Provenance, Schema, and Preprocessing

## 1. Dataset Attribution

- **Dataset Name:** Individual Household Electric Power Consumption Dataset
- **Repository:** UCI Machine Learning Repository
- **URL:** https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption
- **Measurement Frequency:** 1 minute
- **Original Timeframe:** December 2006 – November 2010 (~2,075,259 records)
- **Location:** Sceaux (near Paris), France

### Limitations & Academic Disclosure
1. **Single Household Limitation:** The dataset reflects a single residential home, not a commercial campus or multi-tenant building.
2. **Building Proxy:** For this academic forecasting platform, the dataset is employed as an industrial proxy for building electricity load.
3. **Power vs. Energy Units:**
   - Active Power: Measured in kilowatts (**kW**).
   - Energy: Aggregated over time in kilowatt-hours (**kWh**).
   - Sub-metering: Recorded as watt-hours (**Wh**) per minute.

## 2. Raw Schema

The raw dataset uses semicolon (`;`) delimiters:

| Field | Description | Unit |
| :--- | :--- | :--- |
| `Date` | Date in format `dd/mm/yyyy` | Date string |
| `Time` | Time in format `hh:mm:ss` | Time string |
| `Global_active_power` | Household global minute-averaged active power | kW |
| `Global_reactive_power` | Household global minute-averaged reactive power | kvar |
| `Voltage` | Minute-averaged voltage | Volts (V) |
| `Global_intensity` | Household global minute-averaged current intensity | Amperes (A) |
| `Sub_metering_1` | Energy sub-metering No. 1 (Kitchen appliances) | Wh of electricity |
| `Sub_metering_2` | Energy sub-metering No. 2 (Laundry room) | Wh of electricity |
| `Sub_metering_3` | Energy sub-metering No. 3 (Electric water-heater & AC) | Wh of electricity |

## 3. Preprocessing Policy

1. **Missing Values (`?`):** Missing values in the UCI dataset are indicated by `?`. These are strictly parsed as null/None and **never** silently converted to zero.
2. **Timestamp Normalization:** Date and Time are converted into standard ISO-8601 strings (`YYYY-MM-DDTHH:MM:SS`).
3. **Hourly Resampling:** Minute readings are grouped into hourly buckets (`YYYY-MM-DDTHH:00:00`).
4. **Hourly Completeness Policy:**
   - Each hour contains 60 expected minute measurements.
   - An hourly bucket is marked **complete** (`is_complete = true`) only if at least **45 valid minutes (75%)** are present.
   - For buckets with < 75% coverage, power is flagged to prevent corrupted model training.
5. **Data Leakage Guarantee:**
   - Training, validation, and test splits are partitioned strictly **chronologically** (e.g. 70% train, 15% validation, 15% test).
   - Zero forward-looking or future test observations are used during model training or parameter estimation.
