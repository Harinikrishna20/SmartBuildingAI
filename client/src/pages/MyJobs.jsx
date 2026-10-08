import { useEffect, useState } from 'react'
import { Briefcase } from 'lucide-react'
import { providerApi, requestApi } from '../services/api'

export default function MyJobs() {
  const [jobState, setJobState] = useState([])

  const loadJobs = () => {
    providerApi.getJobs()
      .then(({ jobs = [] }) => setJobState(jobs))
      .catch((error) => {
        console.error('Failed to load jobs', error)
        setJobState([])
      })
  }

  useEffect(() => {
    let active = true
    loadJobs()
    const timer = setInterval(() => {
      if (active) loadJobs()
    }, 4000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const updateStatus = async (id, nextStatus) => {
    try {
      const response = await requestApi.updateStatus(id, nextStatus)
      const updatedJob = response.request
      setJobState((prev) => prev.map((job) => (job.id === id ? { ...job, ...updatedJob, status: updatedJob.status } : job)))
    } catch (error) {
      console.error('Failed to update job status', error)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Jobs</p>
          <h2>My Jobs</h2>
        </div>
      </div>

      <div className="jobs-columns">
        {['Accepted', 'In Progress', 'Completed'].map((section) => (
          <div key={section} className="job-column">
            <h3>{section}</h3>
            {jobState.filter((job) => {
              const st = (job.status || '').toLowerCase().replace(/\s+/g, '_')
              if (section === 'Accepted') return st === 'accepted'
              if (section === 'In Progress') return st === 'in_progress'
              return st === 'completed'
            }).map((job) => (
              <div key={job.id} className="card-surface job-card">
                <div className="request-card__top">
                  <div>
                    <h4>{job.ai_issue || job.category}</h4>
                    <p>{job.category}</p>
                  </div>
                  <Briefcase size={18} />
                </div>
                <p className="request-card__desc">{job.description}</p>
                <ul className="job-meta">
                  <li>Location: {job.address || 'Bengaluru'}</li>
                  <li>Priority: {job.priority_level || 'Medium'} — {job.priority_score ?? job.priority ?? 0}/100</li>
                  <li>Status: {job.status}</li>
                </ul>
                {section !== 'Completed' ? (
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => updateStatus(job.id, section === 'Accepted' ? 'In Progress' : 'Completed')}
                  >
                    {section === 'Accepted' ? 'Start Work' : 'Mark Completed'}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
