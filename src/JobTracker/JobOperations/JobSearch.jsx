import { useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../JobTracker.css';
import './JobSearch.css';

const INDIA_LOCATIONS = [
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Mumbai',
  'Delhi NCR',
  'Kolkata',
  'Ahmedabad',
  'Noida',
  'Gurugram',
  'Kochi',
  'Coimbatore',
  'Jaipur',
  'Indore',
  'Visakhapatnam',
  'Remote India'
];

const JobSearch = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [skills, setSkills] = useState('');
  const [keywords, setKeywords] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState({
    providers: {
      naukri: { jobs: [], error: '' },
      linkedin: { jobs: [], error: '' }
    },
    jobs: [],
    total: 0
  });

  const hasResults = (results.jobs || []).length > 0;

  const grouped = useMemo(() => {
    return {
      naukri: results.providers?.naukri?.jobs || [],
      linkedin: results.providers?.linkedin?.jobs || []
    };
  }, [results]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if ((role || '').trim().length < 2) {
      setError('Please enter at least 2 characters in role/title.');
      return;
    }

    if (!selectedLocations.length) {
      setError('Please select at least one India location.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');

      if (!token || token === 'null' || token === 'undefined') {
        setError('Please login to continue searching jobs.');
        navigate('/');
        return;
      }

      const response = await axios.get('http://127.0.0.1:5000/jobs/search-external', {
        params: {
          role,
          company,
          skills,
          keywords,
          locations: selectedLocations.join(','),
          limit: 20
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.meta?.success) {
        setResults(response.data.data);
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (err) {
      console.error('External search failed:', err);
      if (err.response?.status === 401 || err.response?.status === 422) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('profilename');
        setError('Session is invalid or expired. Please login again.');
        navigate('/');
        return;
      }

      setError(err.response?.data?.meta?.message || err.response?.data?.msg || 'Unable to search jobs right now.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (city) => {
    setSelectedLocations((prev) => {
      if (prev.includes(city)) {
        return prev.filter((item) => item !== city);
      }
      return [...prev, city];
    });
  };

  const handleTrackJob = (job) => {
    navigate('/jobs/add', {
      state: {
        prefill: {
          company: job.company || '',
          role: job.title || '',
          status: 'applied',
          notes: `Source: ${job.provider} | ${job.url}`
        }
      }
    });
  };

  const toExternalUrl = (value) => {
    const raw = String(value || '').trim();
    if (!raw) {
      return '';
    }
    return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  };

  const handleApply = (url) => {
    const externalUrl = toExternalUrl(url);
    if (!externalUrl) {
      return;
    }
    window.open(externalUrl, '_blank', 'noopener,noreferrer');
  };

  const renderProviderJobs = (providerLabel, jobs, providerError) => (
    <section className="job-search-provider-panel">
      <h3>{providerLabel}</h3>
      {providerError && <p className="provider-error">{providerError}</p>}
      {!providerError && jobs.length === 0 && <p className="provider-empty">No jobs found for this provider.</p>}
      <div className="job-search-cards">
        {jobs.map((job) => (
          <article key={`${providerLabel}-${job.url}`} className="job-search-card">
            <div className="job-search-card-top">
              <span className="job-provider-badge">{job.provider}</span>
              {job.posted ? <span className="job-posted">{job.posted}</span> : null}
            </div>
            <h4>{job.title}</h4>
            <p className="job-company">{job.company}</p>
            <p className="job-location">{job.location}</p>
            {job.experience ? <p className="job-experience">Experience: {job.experience}</p> : null}
            <div className="job-card-actions">
              <button
                type="button"
                className="apply-link-btn"
                onClick={() => handleApply(job.url)}
              >
                Apply
              </button>
              <button type="button" className="track-job-btn" onClick={() => handleTrackJob(job)}>
                Track
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  return (
    <div className="jobtracker-container">
      <div className="job-search-shell">
        <h2 className="job-header">Search & Apply Jobs</h2>

        <form className="job-search-form" onSubmit={handleSearch}>
          <div className="search-grid">
            <div className="form-group">
              <label htmlFor="role">Role / Title</label>
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Java Developer"
              />
            </div>
            <div className="form-group">
              <label htmlFor="company">Company (optional)</label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Infosys"
              />
            </div>
            <div className="form-group">
              <label htmlFor="skills">Skills (optional)</label>
              <input
                id="skills"
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g., Python, Django, SQL"
              />
            </div>
            <div className="form-group">
              <label htmlFor="keywords">Additional Keywords (optional)</label>
              <input
                id="keywords"
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., remote, immediate joiner"
              />
            </div>
          </div>

          <div className="location-checkbox-panel">
            <p>Select India Locations (multiple allowed)</p>
            <div className="location-checkbox-grid">
              {INDIA_LOCATIONS.map((city) => (
                <label key={city} className="location-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(city)}
                    onChange={() => toggleLocation(city)}
                  />
                  <span>{city}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="job-search-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Search Jobs'}
          </button>
        </form>

        {error ? <div className="analytics-error">{error}</div> : null}

        {hasResults ? (
          <>
            <p className="search-result-count">Found {results.total} jobs for selected India locations.</p>
            {renderProviderJobs('Naukri', grouped.naukri, results.providers?.naukri?.error || '')}
            {renderProviderJobs('LinkedIn', grouped.linkedin, results.providers?.linkedin?.error || '')}
          </>
        ) : (
          !loading && <p className="provider-empty">Search by role/company/skills and select India locations to browse jobs from Naukri and LinkedIn.</p>
        )}

        <div className="feature-footer-actions">
          <button type="button" onClick={() => navigate('/dashboard')}>Home</button>
          <button type="button" onClick={() => navigate('/jobs')}>Back</button>
        </div>
      </div>
    </div>
  );
};

export default JobSearch;
