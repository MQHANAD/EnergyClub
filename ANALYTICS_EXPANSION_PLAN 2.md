# Analytics Expansion Plan

## Current Implementation Analysis

### What We Have Now
1. **Total Users** - Basic user count
2. **Daily Active Users** - Line chart showing last 30 days
3. **Event Frequency** - Bar chart of most common events
4. **Screen Views Distribution** - Pie chart of most visited pages

### Limitations
- Only covers last 30 days
- No user segmentation
- No retention metrics
- No session analytics
- No geographic insights
- No device/platform analytics
- No conversion funnels
- No engagement depth metrics

---

## Proposed Analytics Additions

### Category 1: Enhanced User Metrics

#### 1.1 Weekly and Monthly Active Users (WAU, MAU)
**Purpose:** Understand user stickiness and growth trends beyond daily metrics

**SQL Query:**
```sql
-- Weekly Active Users
SELECT
  DATE_TRUNC(event_date, WEEK(MONDAY)) as week_start,
  COUNT(DISTINCT user_pseudo_id) as weekly_active_users
FROM `{project_id}.{dataset}.events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 12 WEEK))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY week_start
ORDER BY week_start DESC
```

**SQL Query:**
```sql
-- Monthly Active Users
SELECT
  DATE_TRUNC(event_date, MONTH) as month_start,
  COUNT(DISTINCT user_pseudo_id) as monthly_active_users
FROM `{project_id}.{dataset}.events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY month_start
ORDER BY month_start DESC
```

**Visualization:** Multi-line chart (Daily, Weekly, Monthly)
**Location:** New section after Daily Active Users
**API Endpoint:** `/api/analytics/user-activity?period=daily|weekly|monthly`

---

#### 1.2 New vs Returning Users
**Purpose:** Understand user acquisition vs retention

**SQL Query:**
```sql
SELECT
  event_date,
  COUNT(DISTINCT CASE WHEN is_first_open THEN user_pseudo_id END) as new_users,
  COUNT(DISTINCT CASE WHEN NOT is_first_open THEN user_pseudo_id END) as returning_users,
  COUNT(DISTINCT user_pseudo_id) as total_users
FROM (
  SELECT
    event_date,
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'first_open') as is_first_open
  FROM `{project_id}.{dataset}.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
)
GROUP BY event_date
ORDER BY event_date DESC
```

**Visualization:** Stacked area chart or grouped bar chart
**Location:** Replace or supplement Total Users card
**API Endpoint:** `/api/analytics/user-segments`

---

#### 1.3 User Retention Analysis
**Purpose:** Measure how well we retain users after their first visit

**SQL Query:**
```sql
WITH first_seen AS (
  SELECT
    user_pseudo_id,
    MIN(event_date) as first_event_date
  FROM `{project_id}.{dataset}.events_*`
  GROUP BY user_pseudo_id
)
SELECT
  first_event_date,
  COUNT(DISTINCT user_pseudo_id) as new_users,
  COUNT(DISTINCT CASE WHEN e.event_date = first_seen.first_event_date + 1 THEN e.user_pseudo_id END) as day_1_retained,
  COUNT(DISTINCT CASE WHEN e.event_date = first_seen.first_event_date + 7 THEN e.user_pseudo_id END) as day_7_retained,
  COUNT(DISTINCT CASE WHEN e.event_date = first_seen.first_event_date + 30 THEN e.user_pseudo_id END) as day_30_retained
FROM first_seen
JOIN `{project_id}.{dataset}.events_*` e
  ON e.user_pseudo_id = first_seen.user_pseudo_id
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY first_event_date
ORDER BY first_event_date DESC
LIMIT 30
```

**Visualization:** Heatmap or line chart showing retention cohorts
**Location:** New card in metrics section
**API Endpoint:** `/api/analytics/retention`

---

### Category 2: Session Analytics

#### 2.1 Sessions Count and Average Duration
**Purpose:** Understand how users engage with the app

**SQL Query:**
```sql
SELECT
  event_date,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT user_pseudo_id) as unique_users,
  ROUND(COUNT(DISTINCT session_id) / NULLIF(COUNT(DISTINCT user_pseudo_id), 0), 2) as avg_sessions_per_user
FROM (
  SELECT
    event_date,
    user_pseudo_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'session_id') as session_id
  FROM `{project_id}.{dataset}.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
)
GROUP BY event_date
ORDER BY event_date DESC
```

**Visualization:** Line or area chart
**Location:** New card with sessions metrics
**API Endpoint:** `/api/analytics/sessions`

---

#### 2.2 Top Entry and Exit Pages
**Purpose:** Understand user navigation patterns

**SQL Query:**
```sql
-- Entry Pages
WITH sessions AS (
  SELECT
    user_pseudo_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'session_id') as session_id,
    event_timestamp,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_path') as page_path
  FROM `{project_id}.{dataset}.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
)
SELECT
  page_path as entry_page,
  COUNT(DISTINCT session_id) as session_count
FROM (
  SELECT
    session_id,
    page_path,
    ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY event_timestamp ASC) as rn
  FROM sessions
  WHERE session_id IS NOT NULL AND page_path IS NOT NULL
)
WHERE rn = 1
GROUP BY entry_page
ORDER BY session_count DESC
LIMIT 10
```

**SQL Query:**
```sql
-- Exit Pages
WITH sessions AS (
  SELECT
    user_pseudo_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'session_id') as session_id,
    event_timestamp,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_path') as page_path
  FROM `{project_id}.{dataset}.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
)
SELECT
  page_path as exit_page,
  COUNT(DISTINCT session_id) as session_count
FROM (
  SELECT
    session_id,
    page_path,
    ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY event_timestamp DESC) as rn
  FROM sessions
  WHERE session_id IS NOT NULL AND page_path IS NOT NULL
)
WHERE rn = 1
GROUP BY exit_page
ORDER BY session_count DESC
LIMIT 10
```

**Visualization:** Dual bar charts or comparison table
**Location:** New section for navigation analysis
**API Endpoint:** `/api/analytics/navigation`

---

### Category 3: Geographic and Device Analytics

#### 3.1 Top Countries/Regions
**Purpose:** Understand global user distribution

**SQL Query:**
```sql
SELECT
  geo.country as country,
  COUNT(DISTINCT user_pseudo_id) as unique_users,
  COUNT(*) as total_events
FROM `{project_id}.{dataset}.events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY country
ORDER BY unique_users DESC
LIMIT 20
```

**Visualization:** Horizontal bar chart or map visualization
**Location:** New "Geographic Distribution" section
**API Endpoint:** `/api/analytics/geography`

---

#### 3.2 Device and Platform Breakdown
**Purpose:** Understand which devices and platforms users prefer

**SQL Query:**
```sql
SELECT
  device.category as device_category,
  device.operating_system as os,
  app_info.platform as platform,
  COUNT(DISTINCT user_pseudo_id) as unique_users,
  COUNT(*) as total_events
FROM `{project_id}.{dataset}.events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY device_category, os, platform
ORDER BY unique_users DESC
LIMIT 20
```

**Visualization:** Stacked bar chart or treemap
**Location:** New "Devices & Platforms" section
**API Endpoint:** `/api/analytics/devices`

---

### Category 4: Conversion Funnels

#### 4.1 Registration Funnel
**Purpose:** Track user journey from landing to registration

**SQL Query:**
```sql
WITH user_journey AS (
  SELECT DISTINCT
    user_pseudo_id,
    COUNTIF(event_name = 'screen_view' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'screen_name' = 'Register')) > 0 as viewed_registration,
    COUNTIF(event_name = 'sign_up') > 0 as signed_up
  FROM `{project_id}.{dataset}.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
  GROUP BY user_pseudo_id
)
SELECT
  COUNT(*) as total_users,
  SUM(CAST(viewed_registration AS INT64)) as viewed_registration,
  SUM(CAST(signed_up AS INT64)) as completed_registration,
  ROUND(SUM(CAST(viewed_registration AS INT64)) * 100.0 / COUNT(*), 2) as view_rate,
  ROUND(SUM(CAST(signed_up AS INT64)) * 100.0 / COUNT(*), 2) as signup_rate
FROM user_journey
```

**Visualization:** Funnel chart or progress bars
**Location:** New "Conversion Funnels" section
**API Endpoint:** `/api/analytics/funnels`

---

### Category 5: Engagement Metrics

#### 5.1 Event Engagement Depth
**Purpose:** Measure how deeply users engage with specific features

**SQL Query:**
```sql
SELECT
  event_name,
  COUNT(DISTINCT user_pseudo_id) as users_with_event,
  COUNT(*) as total_occurrences,
  ROUND(COUNT(*) / COUNT(DISTINCT user_pseudo_id), 2) as avg_per_user
FROM `{project_id}.{dataset}.events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY event_name
HAVING users_with_event > 10
ORDER BY avg_per_user DESC
LIMIT 20
```

**Visualization:** Horizontal bar chart
**Location:** New "Engagement Depth" section
**API Endpoint:** `/api/analytics/engagement`

---

#### 5.2 Time-Based Usage Patterns
**Purpose:** Understand when users are most active

**SQL Query:**
```sql
SELECT
  EXTRACT(HOUR FROM TIMESTAMP_MICROS(event_timestamp)) as hour_of_day,
  EXTRACT(DAYOFWEEK FROM TIMESTAMP_MICROS(event_timestamp)) as day_of_week,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_pseudo_id) as unique_users
FROM `{project_id}.{dataset}.events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY hour_of_day, day_of_week
ORDER BY day_of_week, hour_of_day
```

**Visualization:** Heatmap or multi-line chart
**Location:** New "Usage Patterns" section
**API Endpoint:** `/api/analytics/usage-patterns`

---

### Category 6: Error and Performance Tracking

#### 6.1 Error Events and Crashes
**Purpose:** Monitor app health and user experience

**SQL Query:**
```sql
SELECT
  event_name,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'error_message') as error_message,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_pseudo_id) as affected_users
FROM `{project_id}.{dataset}.events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
  AND event_name LIKE '%error%' OR event_name LIKE '%crash%'
GROUP BY event_name, error_message
ORDER BY error_count DESC
LIMIT 20
```

**Visualization:** Error log table or trend chart
**Location:** New "App Health" section
**API Endpoint:** `/api/analytics/errors`

---

## Implementation Priority

### Phase 1 (High Priority - Immediate Value)
1. ✅ Weekly/Monthly Active Users - Shows growth trends
2. ✅ New vs Returning Users - Foundation for retention
3. ✅ Device & Platform Breakdown - Essential for targeting
4. ✅ Geographic Distribution - Understand market

### Phase 2 (Medium Priority - User Insights)
5. User Retention Analysis
6. Session Analytics
7. Navigation Patterns (Entry/Exit Pages)

### Phase 3 (Advanced - Optimization)
8. Conversion Funnels
9. Engagement Depth Analysis
10. Usage Time Patterns
11. Error Tracking

---

## Recommended Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Analytics Dashboard                                          │
├─────────────────────────────────────────────────────────────┤
│ [Key Metrics Row]                                           │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ Total   │ │ WAU     │ │ MAU     │ │ New vs  │           │
│ │ Users   │ │ Active  │ │ Active  │ │ Return  │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│ Active Users Over Time                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  [Multi-line Chart: Daily, Weekly, Monthly]              │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [User Segments Row]                                         │
│ ┌─────────────┐ ┌─────────────┐                           │
│ │ Retention   │ │ Geographic  │                           │
│ │ Cohort      │ │ Distribution│                           │
│ │ [Heatmap]   │ │ [Map/Bars]  │                           │
│ └─────────────┘ └─────────────┘                           │
├─────────────────────────────────────────────────────────────┤
│ Devices & Platforms                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  [Stacked Bar Chart: OS + Device Category]             │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [Event Analytics Row]                                       │
│ ┌─────────────┐ ┌─────────────┐                           │
│ │ Event       │ │ Engagement  │                           │
│ │ Frequency   │ │ Depth       │                           │
│ │ [Bar Chart] │ │ [Table]     │                           │
│ └─────────────┘ └─────────────┘                           │
├─────────────────────────────────────────────────────────────┤
│ Navigation Patterns                                         │
│ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │ Entry Pages          │ │ Exit Pages           │          │
│ │ [Horizontal Bars]    │ │ [Horizontal Bars]    │          │
│ └──────────────────────┘ └──────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Structure

### Extend `/api/analytics/route.ts` to support:
1. `/api/analytics?type=overview` - Current implementation
2. `/api/analytics?type=user-activity&period=weekly`
3. `/api/analytics?type=retention`
4. `/api/analytics?type=geography`
5. `/api/analytics?type=devices`
6. `/api/analytics?type=funnels&funnel=registration`
7. `/api/analytics?type=engagement`
8. `/api/analytics?type=usage-patterns`
9. `/api/analytics?type=errors`

---

## Next Steps for Implementation

1. **Create extended types** in `src/types/analytics.ts`
2. **Update API route** with conditional queries based on `type` parameter
3. **Add new chart components** for funnel, heatmap, etc.
4. **Implement tabbed sections** in the dashboard for better organization
5. **Add date range picker** to allow users to select custom time periods
6. **Add export functionality** for CSV/PDF reports

Would you like me to start implementing any of these analytics features?

