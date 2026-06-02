import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import '../JobTracker.css';
import './JobAnalytics.css';

const JobAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState({
    summary: {
      total_jobs: 0,
      recent_30_days: 0,
      interviews: 0,
      offers: 0,
      rejected: 0,
      interview_rate: 0,
      offer_rate: 0
    },
    status_breakdown: [],
    monthly_trend: [],
    top_companies: []
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');
      const response = await api.get('/jobs/analytics', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.meta?.success) {
        setAnalytics(response.data.data);
      } else {
        setError('Unable to load analytics');
      }
    } catch (err) {
      console.error('Analytics fetch failed:', err);
      setError(err.response?.data?.meta?.message || 'Failed to load job analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportAnalyticsCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Applications', analytics.summary.total_jobs],
      ['Last 30 Days', analytics.summary.recent_30_days],
      ['Interview Rate %', analytics.summary.interview_rate],
      ['Offer Rate %', analytics.summary.offer_rate],
      ['Interviews', analytics.summary.interviews],
      ['Offers', analytics.summary.offers],
      ['Rejected', analytics.summary.rejected],
      [],
      ['Top Companies', 'Applications'],
      ...(analytics.top_companies || []).map((item) => [item.company, item.count]),
      [],
      ['Month', 'Applications'],
      ...(analytics.monthly_trend || []).map((item) => [item.label, item.count])
    ];

    const csvText = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'job_analytics.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const maxMonthlyCount = useMemo(() => {
    const counts = (analytics.monthly_trend || []).map((item) => item.count || 0);
    return Math.max(...counts, 1);
  }, [analytics.monthly_trend]);

  const maxStatusCount = useMemo(() => {
    const counts = (analytics.status_breakdown || []).map((item) => item.count || 0);
    return Math.max(...counts, 1);
  }, [analytics.status_breakdown]);

  if (loading) {
    return (
      <div className="jobtracker-container">
        <div className="job-analytics-shell">Loading job analytics...</div>
      </div>
    );
  }

  return (
    <div className="jobtracker-container">
      <div className="job-analytics-shell">
        <h2 className="job-header">Job Analytics</h2>

        <div className="analytics-actions-row">
          <button type="button" className="analytics-action-btn" onClick={fetchAnalytics}>Refresh</button>
          <button type="button" className="analytics-action-btn export" onClick={exportAnalyticsCsv}>Export CSV</button>
        </div>

        {error ? (
          <div className="analytics-error">{error}</div>
        ) : (
          <>
            <div className="analytics-summary-grid">
              <div className="analytics-card">
                <p>Total Applications</p>
                <h3>{analytics.summary.total_jobs}</h3>
              </div>
              <div className="analytics-card">
                <p>Last 30 Days</p>
                <h3>{analytics.summary.recent_30_days}</h3>
              </div>
              <div className="analytics-card">
                <p>Interview Rate</p>
                <h3>{analytics.summary.interview_rate}%</h3>
              </div>
              <div className="analytics-card">
                <p>Offer Rate</p>
                <h3>{analytics.summary.offer_rate}%</h3>
              </div>
            </div>

            <div className="analytics-section-grid">
              <section className="analytics-panel">
                <h3>Status Breakdown</h3>
                {(analytics.status_breakdown || []).map((row) => {
                  const widthPct = ((row.count || 0) / maxStatusCount) * 100;
                  return (
                    <div key={row.status} className="analytics-bar-row">
                      <div className="analytics-bar-label">{row.status}</div>
                      <div className="analytics-bar-track">
                        <div className="analytics-bar-fill" style={{ width: `${widthPct}%` }} />
                      </div>
                      <div className="analytics-bar-count">{row.count}</div>
                    </div>
                  );
                })}
              </section>

              <section className="analytics-panel">
                <h3>Applications Trend (Last 6 Months)</h3>
                {(analytics.monthly_trend || []).map((row) => {
                  const widthPct = ((row.count || 0) / maxMonthlyCount) * 100;
                  return (
                    <div key={row.key} className="analytics-bar-row">
                      <div className="analytics-bar-label">{row.label}</div>
                      <div className="analytics-bar-track">
                        <div className="analytics-bar-fill trend" style={{ width: `${widthPct}%` }} />
                      </div>
                      <div className="analytics-bar-count">{row.count}</div>
                    </div>
                  );
                })}
              </section>
            </div>

            <section className="analytics-panel">
              <h3>Top Companies</h3>
              {analytics.top_companies?.length ? (
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Applications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.top_companies.map((row) => (
                      <tr key={row.company}>
                        <td>{row.company}</td>
                        <td>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="analytics-empty">No application data available yet.</p>
              )}
            </section>
          </>
        )}

        <div className="feature-footer-actions">
          <button type="button" onClick={() => navigate('/dashboard')}>Home</button>
          <button type="button" onClick={() => navigate('/jobs')}>Back</button>
        </div>
      </div>
    </div>
  );
};

export default JobAnalytics;
