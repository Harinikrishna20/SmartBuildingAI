import { Briefcase, CheckCheck, Gauge, MapPinned, Play, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { providerApi, requestApi } from '../services/api'

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [jobs, setJobs] = useState([])
  const [profile, setProfile] = useState(null)
  const [availabilityError, setAvailabilityError] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const loadDashboardData = () =>
    Promise.all([
      providerApi.getRequests().catch(() => ({ requests: [] })),
      providerApi.getJobs().catch(() => ({ jobs: [] })),
      providerApi.getProfile().catch(() => ({ profile: null })),
    ]).then(([requestResult, jobResult, profileResult]) => {
      setRequests(requestResult.requests || [])
      setJobs(jobResult.jobs || [])
      if (profileResult.profile) setProfile(profileResult.profile)
    })

  useEffect(() => {
    let active = true
    loadDashboardData()
    const timer = setInterval(() => {
      if (active) loadDashboardData()
    }, 4000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const countJobs = (st) =>
    jobs.filter((job) => (job.status || '').toLowerCase().replace(/\s+/g, '_') === st).length

  const handleAvailabilityChange = async (event) => {
    const availability = event.target.value
    setAvailabilityError('')
    try {
      const result = await providerApi.updateAvailability({ availability })
      setProfile(result.profile)
    } catch (error) {
      setAvailabilityError(error.message || 'Unable to update availability.')
    }
  }

  const handleRequestAction = async (request, action) => {
    setRequestMessage('')
    setUpdatingId(request.id)
    try {
      if (action === 'accept') {
        await requestApi.acceptRequest(request.id, profile)
        setRequestMessage(`Request #${request.id} accepted. Status updated to ACCEPTED in database.`)
      } else {
        await providerApi.rejectRequest(request.id)
        setRequestMessage(`Request #${request.id} dismissed.`)
      }
      await loadDashboardData()
    } catch (error) {
      setRequestMessage(error.message || 'Unable to update this request.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleStatusTransition = async (jobId, targetStatus) => {
    setRequestMessage('')
    setUpdatingId(jobId)
    try {
      await requestApi.updateStatus(jobId, targetStatus)
      setRequestMessage(`Job #${jobId} status updated to ${targetStatus.toUpperCase()} in database.`)
      await loadDashboardData()
    } catch (error) {
      setRequestMessage(error.message || 'Unable to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const activeJobs = jobs.filter((job) => {
    const st = (job.status || '').toLowerCase().replace(/\s+/g, '_')
    return st === 'accepted' || st === 'in_progress'
  })

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Provider overview</p>
          <h2>Service provider operations</h2>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Available Requests" value={String(requests.length)} accent="blue" icon={MapPinned} />
        <StatCard title="Accepted Jobs" value={String(countJobs('accepted'))} accent="teal" icon={CheckCheck} />
        <StatCard title="In Progress" value={String(countJobs('in_progress'))} accent="amber" icon={Gauge} />
        <StatCard title="Completed" value={String(countJobs('completed'))} accent="green" icon={Briefcase} />
      </div>

      {requestMessage ? <p className="field-hint" role="status" style={{ fontWeight: '500' }}>{requestMessage}</p> : null}

      <div className="provider-stack">
        {/* NEW SERVICE REQUEST SECTION */}
        <div className="card-surface">
          <div className="section-head">
            <h3>NEW SERVICE REQUEST</h3>
            <span className="status-badge status-badge--info">{requests.length} New</span>
          </div>

          {requests.length ? (
            <div className="request-grid request-grid--list">
              {requests.map((request) => (
                <article key={request.id} className="request-card" style={{ border: '1px solid var(--border-subtle)' }}>
                  <div className="request-card__top">
                    <div>
                      <p className="eyebrow">NEW SERVICE REQUEST</p>
                      <h4 style={{ fontSize: '1.2rem', marginTop: '0.2rem' }}>
                        Issue: {request.ai_issue || request.category}
                      </h4>
                      <p className="muted">Category: {request.category}</p>
                    </div>
                    <strong>Priority: {request.priority_level || 'High'} ({request.priority_score ?? 0}/100)</strong>
                  </div>
                  <p className="request-card__desc"><strong>Description:</strong> {request.description}</p>
                  <div className="request-card__actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem' }}>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => handleRequestAction(request, 'accept')}
                      disabled={updatingId === request.id}
                    >
                      {updatingId === request.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => handleRequestAction(request, 'reject')}
                      disabled={updatingId === request.id}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => navigate(`/provider/request-details/${request.id}`)}
                    >
                      Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No incoming service requests waiting.</p>
          )}
        </div>

        {/* ACTIVE JOBS WITH START WORK AND MARK AS COMPLETED WORKFLOW */}
        <div className="card-surface">
          <div className="section-head">
            <h3>Active Service Jobs</h3>
            <span className="status-badge status-badge--warning">{activeJobs.length} Active</span>
          </div>

          {activeJobs.length ? (
            <div className="request-grid request-grid--list">
              {activeJobs.map((job) => {
                const normStatus = (job.status || '').toLowerCase().replace(/\s+/g, '_')
                const isAccepted = normStatus === 'accepted'
                const isInProgress = normStatus === 'in_progress'

                return (
                  <article key={job.id} className="request-card" style={{ border: '1px solid var(--border-subtle)' }}>
                    <div className="request-card__top">
                      <div>
                        <h4 style={{ fontSize: '1.2rem' }}>{job.ai_issue || job.category}</h4>
                        <p className="muted">Category: {job.category} · Priority: {job.priority_level || 'Medium'}</p>
                      </div>
                      <span className={`status-badge ${isInProgress ? 'status-badge--warning' : 'status-badge--info'}`}>
                        {isInProgress ? 'IN_PROGRESS' : 'ACCEPTED'}
                      </span>
                    </div>

                    <p className="request-card__desc"><strong>Description:</strong> {job.description}</p>
                    <p className="field-hint" style={{ marginTop: '0.25rem' }}>Location: {job.address || 'Bengaluru'}</p>

                    <div className="request-card__actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem' }}>
                      {isAccepted ? (
                        <button
                          type="button"
                          className="primary-btn"
                          onClick={() => handleStatusTransition(job.id, 'In Progress')}
                          disabled={updatingId === job.id}
                        >
                          <Play size={16} />
                          {updatingId === job.id ? 'Starting...' : 'Start Work'}
                        </button>
                      ) : null}

                      {isInProgress ? (
                        <button
                          type="button"
                          className="primary-btn"
                          style={{ background: '#2fa58d', borderColor: '#2fa58d' }}
                          onClick={() => handleStatusTransition(job.id, 'Completed')}
                          disabled={updatingId === job.id}
                        >
                          <CheckCheck size={16} />
                          {updatingId === job.id ? 'Completing...' : 'Mark as Completed'}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => navigate(`/provider/request-details/${job.id}`)}
                      >
                        Details
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="muted">No accepted or in-progress jobs. Accept a request above to start work.</p>
          )}
        </div>

        <div className="card-surface">
          <div className="section-head">
            <h3>Dispatch readiness</h3>
          </div>
          <div className="readiness-card">
            <Wrench size={20} />
            <div>
              <label htmlFor="provider-availability">Availability</label>
              <select id="provider-availability" value={profile?.availability || 'Available'} onChange={handleAvailabilityChange}>
                <option value="Available">Available</option>
                <option value="Busy">Unavailable</option>
              </select>
              <p>{profile ? `${profile.service_category || 'Service'} · ${profile.location || 'Location not set'}` : 'Provider profile details are not available.'}</p>
            </div>
          </div>
          {availabilityError ? <p className="field-error" role="alert">{availabilityError}</p> : null}
        </div>
      </div>
    </div>
  )
}
