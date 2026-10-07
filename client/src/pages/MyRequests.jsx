import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RequestCard from '../components/RequestCard'
import { requestApi } from '../services/api'

const tabs = ['All', 'Requested', 'Accepted', 'In Progress', 'Completed']

export default function MyRequests() {
  const [requests, setRequests] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const navigate = useNavigate()

  useEffect(() => {
    requestApi.getAll()
      .then(({ requests: data = [] }) => setRequests(data))
      .catch((error) => {
        console.error('Failed to load requests', error)
        setRequests([])
      })
  }, [])

  const filteredRequests = useMemo(() => {
    if (activeTab === 'All') return requests
    if (activeTab === 'Requested') return requests.filter((request) => request.status === 'requested')
    if (activeTab === 'Accepted') return requests.filter((request) => request.status === 'accepted')
    if (activeTab === 'In Progress') return requests.filter((request) => request.status === 'in_progress')
    return requests.filter((request) => request.status === 'completed')
  }, [activeTab, requests])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Requests</p>
          <h2>My Requests</h2>
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map((tab) => (
          <button type="button" key={tab} className={activeTab === tab ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className="request-grid request-grid--list">
        {filteredRequests.length ? filteredRequests.map((request) => (
          <RequestCard key={request.id} request={{ ...request, date: request.requestedAt || request.date }} onView={() => navigate(`/resident/request-details/${request.id}`)} />
        )) : (
          <div className="empty-state card-surface">
            <h3>No maintenance requests yet</h3>
            <p>Report your first household problem.</p>
            <button type="button" className="primary-btn" onClick={() => navigate('/resident/report-problem')}>Report Problem</button>
          </div>
        )}
      </div>
    </div>
  )
}
