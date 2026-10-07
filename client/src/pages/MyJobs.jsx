import { useEffect, useState } from 'react'
import { Briefcase } from 'lucide-react'
import { providerApi, requestApi } from '../services/api'

export default function MyJobs() {
  const [jobState, setJobState] = useState([])

  useEffect(() => {
    providerApi.getJobs()
      .then(({ jobs = [] }) => setJobState(jobs))
      .catch((error) => {
        console.error('Failed to load jobs', error)
        setJobState([])
      })
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
              if (section === 'Accepted') return job.status === 'accepted'
              if (section === 'In Progress') return job.status === 'in_progress'
              return job.status === 'completed'
            }).map((job) => (
              <div key={job.id} className="card-surface job-card">
                <div className="request-card__top">
                  <div>
                    <h4>{job.category}</h4>
                    <p>{job.description}</p>
                  </div>
                  <Briefcase size={18} />
                </div>
                <ul className="job-meta">
                  <li>Location: {job.address || 'N/A'}</li>
                  <li>Priority: {job.priority_level || 'Medium'} — {job.priority_score ?? job.priority ?? 0}/100</li>
                  <li>Status: {job.status}</li>
                </ul>
                {section !== 'Completed' ? (
                  <button type="button" className="primary-btn" onClick={() => updateStatus(job.id, section === 'Accepted' ? 'in_progress' : 'completed')}>
                    {section === 'Accepted' ? 'Mark In Progress' : 'Mark Completed'}
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
