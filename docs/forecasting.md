# Forecasting Methodology & Evaluation Framework

## 1. Modeling Methodologies

### A. Seasonal Naive Baseline
- **Role:** Empirical benchmark model.
- **Formulation:**
  $$\hat{y}_{t+h} = y_{t+h-s}$$
  where $s = 24$ (diurnal cycle).
- **Purpose:** Statistical and machine learning models must demonstrate superior performance over this baseline to justify operational deployment.

### B. ARIMA / SARIMAX
- **Specification:** SARIMAX $(p=1, d=1, q=1) \times (P=1, D=1, Q=0)_{s=24}$.
- **Dynamics:** Captures autoregressive persistence, first-order differencing for stationarity, moving-average shock absorption, and a 24-step seasonal lag to model day/night diurnal variations.

### C. Prophet (Generalized Additive Model)
- **Formulation:**
  $$y(t) = g(t) + s_{daily}(t) + s_{weekly}(t) + \epsilon_t$$
  - $g(t)$: Piecewise linear trend.
  - $s_{daily}(t)$: Diurnal Fourier series ($N=4$ harmonics, 24-hour period).
  - $s_{weekly}(t)$: Weekday vs. weekend load variations.
  - $\epsilon_t$: Gaussian noise for calibrated 90% confidence intervals.

## 2. Evaluation Metrics & Zero-Value Policy

1. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{n}\sum_{i=1}^{n} |y_i - \hat{y}_i|$$

2. **Root Mean Squared Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{n}\sum_{i=1}^{n} (y_i - \hat{y}_i)^2}$$

3. **Weighted Absolute Percentage Error (WAPE):**
   $$\text{WAPE} = \frac{\sum_{i=1}^{n} |y_i - \hat{y}_i|}{\sum_{i=1}^{n} y_i} \times 100\%$$

4. **Mean Absolute Percentage Error (MAPE):**
   $$\text{MAPE} = \frac{100\%}{n_{eligible}} \sum_{i \in \text{eligible}} \left|\frac{y_i - \hat{y}_i}{y_i}\right|$$

### Zero / Near-Zero Handling Policy
In smart-meter electricity time series, base power can occasionally drop to zero or trace values during unoccupied periods. Dividing by near-zero numbers causes MAPE to explode to hundreds of percent without reflecting true model quality.
- **Threshold:** Observations where $y_i < 0.05\text{ kW}$ are excluded from the MAPE denominator.
- **Transparency:** The evaluation engine explicitly reports the count of excluded observations and displays a warning note.
- **Unbiased Metric:** WAPE is reported alongside MAPE as it aggregates absolute errors against total consumption without denominator volatility.

## 3. Peak Demand Detection

For each 24-hour forecast window:
$$\text{Peak Demand} = \max_{h \in [1, 24]} \hat{y}_{t+h}$$
$$\text{Peak Time} = \arg\max_{h \in [1, 24]} \hat{y}_{t+h}$$
Top peak hours are ranked to provide facility managers with actionable demand-response windows.
