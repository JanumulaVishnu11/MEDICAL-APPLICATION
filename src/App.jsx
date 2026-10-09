import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'ruralcare-v2'

const hospitals = [
  {
    id: 'green-valley',
    name: 'Green Valley District Hospital',
    distance: '4.8 km',
    rating: 4.9,
    wait: '12 min',
    services: ['Emergency Ward', 'ICU', 'Ambulance'],
    status: 'Available now',
    accent: 'emerald'
  },
  {
    id: 'towncare',
    name: 'Towncare Medical Center',
    distance: '7.2 km',
    rating: 4.7,
    wait: '18 min',
    services: ['Trauma', 'Maternity', 'Diagnostics'],
    status: '2 ambulances active',
    accent: 'blue'
  },
  {
    id: 'hope-foundation',
    name: 'Hope Foundation Clinic',
    distance: '9.5 km',
    rating: 4.8,
    wait: '9 min',
    services: ['Primary Care', 'Pharmacy', 'Blood Bank'],
    status: 'High demand',
    accent: 'violet'
  }
]

const alerts = [
  'Ambulance dispatched to Meerut village',
  'Covid support line active till 10 PM',
  'Two nearby hospitals available for trauma care'
]

const navItems = [
  'Overview',
  'Nearby Hospitals',
  'Emergency Care',
  'Medical Records',
  'Community Help'
]

const defaultHistory = [
  {
    id: 1,
    hospital: hospitals[0].name,
    time: 'Today • 08:10 AM',
    status: 'Ambulance dispatched'
  }
]

const createForm = (hospitalId, currentLocation) => ({
  patientName: 'Asha Verma',
  phone: '+91 98765 43210',
  emergencyType: 'Accident / Injury',
  location: currentLocation || 'Rampur Village',
  hospitalId,
  notes: ''
})

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitals[0].id)
  const [location, setLocation] = useState('Rampur Village')
  const [patientName, setPatientName] = useState('Asha Verma')
  const [phone, setPhone] = useState('+91 98765 43210')
  const [history, setHistory] = useState(defaultHistory)
  const [dialog, setDialog] = useState({ open: false, type: 'request', form: createForm(hospitals[0].id, 'Rampur Village') })
  const [result, setResult] = useState(null)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    try {
      const saved = JSON.parse(raw)
      if (saved.activePage) setActivePage(saved.activePage)
      if (saved.selectedHospitalId) setSelectedHospitalId(saved.selectedHospitalId)
      if (saved.location) setLocation(saved.location)
      if (saved.patientName) setPatientName(saved.patientName)
      if (saved.phone) setPhone(saved.phone)
      if (saved.history && Array.isArray(saved.history)) setHistory(saved.history)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activePage,
        selectedHospitalId,
        location,
        patientName,
        phone,
        history
      })
    )
  }, [activePage, selectedHospitalId, location, patientName, phone, history])

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => hospital.id === selectedHospitalId) || hospitals[0],
    [selectedHospitalId]
  )

  const openDialog = (type, hospitalId = selectedHospitalId) => {
    setDialog({
      open: true,
      type,
      form: {
        ...createForm(hospitalId, location),
        patientName,
        phone
      }
    })
  }

  const closeDialog = () => {
    setDialog((current) => ({ ...current, open: false }))
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setDialog((current) => ({
      ...current,
      form: {
        ...current.form,
        [name]: value
      }
    }))
  }

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocation('Location access unavailable')
      setResult({
        kind: 'error',
        title: 'Location unavailable',
        message: 'This browser does not support GPS access.'
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4)
        const lng = position.coords.longitude.toFixed(4)
        const newLocation = `Latitude ${lat}, Longitude ${lng}`
        setLocation(newLocation)
        setDialog((current) => ({
          ...current,
          form: {
            ...current.form,
            location: newLocation
          }
        }))
        setResult({
          kind: 'success',
          title: 'Location shared',
          message: 'Your current location has been updated successfully.'
        })
      },
      () => {
        setLocation('Permission denied. Using village location.')
        setResult({
          kind: 'error',
          title: 'Location permission required',
          message: 'Please allow location access to share your real-time location.'
        })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleEmergencySubmit = (event) => {
    event.preventDefault()

    const form = dialog.form
    const isMissing = !form.patientName?.trim() || !form.phone?.trim() || !form.notes?.trim()

    if (isMissing) {
      setResult({
        kind: 'error',
        title: 'Booking failed',
        message: 'Please fill all required details before submitting.'
      })
      return
    }

    const hospital = hospitals.find((item) => item.id === form.hospitalId) || selectedHospital

    const record = {
      id: Date.now(),
      hospital: hospital.name,
      time: 'Just now',
      status: dialog.type === 'emergency' ? 'Emergency request sent' : 'Booking confirmed'
    }

    setHistory((current) => [record, ...current].slice(0, 5))
    setPatientName(form.patientName)
    setPhone(form.phone)
    setLocation(form.location)
    setSelectedHospitalId(form.hospitalId)
    setDialog({ open: false, type: 'request', form: createForm(form.hospitalId, form.location) })
    setResult({
      kind: 'success',
      title: dialog.type === 'emergency' ? 'Emergency request sent' : 'Booking successful',
      message:
        dialog.type === 'emergency'
          ? `Help is being coordinated with ${hospital.name}.`
          : `Your appointment request for ${hospital.name} was submitted successfully.`
    })
  }

  const handleDoctorCall = () => {
    window.location.href = 'tel:+919876543210'
  }

  const renderOverview = () => (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Good morning</p>
          <h1>Village health dashboard</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-btn" onClick={handleShareLocation}>Share location</button>
          <button className="primary-btn" onClick={() => openDialog('emergency')}>Request emergency</button>
        </div>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow green">Emergency response</p>
          <h2>Connect to the nearest hospital in minutes.</h2>
          <p>
            Rapid access to ambulances, doctor availability, and in-town hospital care for rural families.
          </p>
          <div className="hero-actions">
            <button className="primary-btn large" onClick={() => openDialog('emergency')}>Call ambulance</button>
            <button className="ghost-btn large" onClick={() => setActivePage('Nearby Hospitals')}>Find hospital</button>
          </div>
        </div>

        <div className="map-card">
          <div className="map-header">
            <span>Current location</span>
            <strong>{location}</strong>
          </div>
          <div className="map-grid">
            <span className="pin pin-a">A</span>
            <span className="pin pin-b">H</span>
            <span className="pin pin-c">C</span>
          </div>
          <div className="route-line route-one" />
          <div className="route-line route-two" />
        </div>
      </section>

      <section className="stat-row">
        { [
          { label: 'Patients matched', value: '1,482' },
          { label: 'Average response', value: '11 min' },
          { label: 'Critical cases helped', value: '320' }
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </section>

      <section className="panel-grid">
        <div className="panel main-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Available facilities</p>
              <h3>Nearby hospitals</h3>
            </div>
            <button className="text-btn" onClick={() => setActivePage('Nearby Hospitals')}>View all</button>
          </div>

          <div className="hospital-list">
            {hospitals.map((hospital) => (
              <article
                key={hospital.id}
                className={`hospital-card ${hospital.accent} ${selectedHospitalId === hospital.id ? 'selected' : ''}`}
                onClick={() => setSelectedHospitalId(hospital.id)}
              >
                <div className="hospital-topline">
                  <div>
                    <h4>{hospital.name}</h4>
                    <div className="meta-row">
                      <span>📍 {hospital.distance}</span>
                      <span>⭐ {hospital.rating}</span>
                    </div>
                  </div>
                  <span className="status-pill">{hospital.status}</span>
                </div>

                <div className="service-row">
                  {hospital.services.map((service) => (
                    <span key={service} className="service-tag">{service}</span>
                  ))}
                </div>

                <div className="hospital-footer">
                  <span>Wait time: {hospital.wait}</span>
                  <button
                    className="small-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      openDialog('booking', hospital.id)
                    }}
                  >
                    Book visit
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel side-panel">
          <div className="section-header compact">
            <div>
              <p className="eyebrow">Live updates</p>
              <h3>Today’s alerts</h3>
            </div>
          </div>

          <div className="status-box">
            <span className="status-label">Selected hospital</span>
            <strong>{selectedHospital.name}</strong>
            <small>{selectedHospital.distance} away • {selectedHospital.wait} wait</small>
          </div>

          <div className="alert-list">
            {alerts.map((alert, index) => (
              <div key={alert} className="alert-item">
                <span className={`dot dot-${index + 1}`} />
                <p>{alert}</p>
              </div>
            ))}
          </div>

          <div className="quick-actions">
            <button className="primary-btn full" onClick={() => openDialog('emergency')}>Emergency booking</button>
            <button className="ghost-btn full" onClick={handleDoctorCall}>Contact doctor</button>
          </div>

          <div className="history-card">
            <span className="history-title">Recent activity</span>
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <div>
                  <strong>{item.status}</strong>
                  <p>{item.hospital}</p>
                </div>
                <small>{item.time}</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )

  const renderNearbyHospitals = () => (
    <div className="page-content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Nearby care</p>
          <h2>Hospital network</h2>
        </div>
        <button className="primary-btn" onClick={() => openDialog('booking')}>Book now</button>
      </header>

      <div className="wide-list">
        {hospitals.map((hospital) => (
          <article key={hospital.id} className={`wide-card ${hospital.accent}`}>
            <div className="wide-card-head">
              <div>
                <h3>{hospital.name}</h3>
                <p>{hospital.distance} away • {hospital.status}</p>
              </div>
              <span className="rating-badge">⭐ {hospital.rating}</span>
            </div>

            <div className="service-row">
              {hospital.services.map((service) => (
                <span key={service} className="service-tag">{service}</span>
              ))}
            </div>

            <div className="wide-card-foot">
              <span>Average wait: {hospital.wait}</span>
              <button className="small-btn" onClick={() => openDialog('booking', hospital.id)}>Schedule visit</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )

  const renderEmergencyCare = () => (
    <div className="page-content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Emergency support</p>
          <h2>Critical care support</h2>
        </div>
        <button className="primary-btn" onClick={() => openDialog('emergency')}>Request emergency</button>
      </header>

      <div className="info-grid">
        <div className="info-card danger">
          <h3>Immediate actions</h3>
          <ul>
            <li>Call ambulance for trauma, severe bleeding, breathing issues.</li>
            <li>Keep the patient stable and comfortable.</li>
            <li>Share current GPS location and patient condition.</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Emergency hotline</h3>
          <div className="hotline-box">
            <strong>108 / 112</strong>
            <span>24/7 emergency dispatch</span>
          </div>
        </div>

        <div className="info-card">
          <h3>Nearby response</h3>
          <p>Ambulance ETA: 11 minutes</p>
          <p>Nearest ICU: {selectedHospital.name}</p>
        </div>
      </div>
    </div>
  )

  const renderMedicalRecords = () => (
    <div className="page-content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Patient profile</p>
          <h2>Medical records</h2>
        </div>
      </header>

      <div className="profile-card">
        <div className="profile-row">
          <span className="avatar">AV</span>
          <div>
            <h3>{patientName}</h3>
            <p>Village resident • Mobile: {phone}</p>
          </div>
        </div>

        <div className="record-grid">
          <div className="mini-record">
            <span>Blood group</span>
            <strong>B+</strong>
          </div>
          <div className="mini-record">
            <span>Last checkup</span>
            <strong>May 2026</strong>
          </div>
          <div className="mini-record">
            <span>Allergies</span>
            <strong>Penicillin</strong>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCommunityHelp = () => (
    <div className="page-content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Local support</p>
          <h2>Community help</h2>
        </div>
      </header>

      <div className="community-grid">
        <div className="info-card">
          <h3>Volunteer network</h3>
          <ul>
            <li>18 trained first-aid volunteers nearby</li>
            <li>2 women support coordinators active</li>
            <li>Drivers available for urgent transfers</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Blood bank</h3>
          <p>AB+ available in the district network</p>
          <button className="ghost-btn full" onClick={() => openDialog('booking')}>Request support</button>
        </div>
      </div>
    </div>
  )

  const renderPageContent = () => {
    switch (activePage) {
      case 'Nearby Hospitals':
        return renderNearbyHospitals()
      case 'Emergency Care':
        return renderEmergencyCare()
      case 'Medical Records':
        return renderMedicalRecords()
      case 'Community Help':
        return renderCommunityHelp()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">+</div>
          <div>
            <p className="eyebrow">RuralCare</p>
            <h3>Emergency Access</h3>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`nav-item ${activePage === item ? 'active' : ''}`}
              onClick={() => setActivePage(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="support-card">
          <p className="mini-label">Emergency hotline</p>
          <h4>108 / 112</h4>
          <span>24/7 response support</span>
        </div>
      </aside>

      <main className="content">{renderPageContent()}</main>

      {dialog.open && (
        <div className="modal-backdrop" onClick={closeDialog}>
          <div className="dialog-modal" onClick={(event) => event.stopPropagation()}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Emergency request</p>
                <h3>{dialog.type === 'emergency' ? 'Request emergency help' : 'Book hospital visit'}</h3>
              </div>
              <button type="button" className="close-btn" onClick={closeDialog}>×</button>
            </div>

            <form className="booking-form" onSubmit={handleEmergencySubmit}>
              <div className="form-grid">
                <label>
                  Patient name
                  <input
                    name="patientName"
                    value={dialog.form.patientName}
                    onChange={handleFieldChange}
                    placeholder="Enter patient name"
                  />
                </label>

                <label>
                  Phone number
                  <input
                    name="phone"
                    value={dialog.form.phone}
                    onChange={handleFieldChange}
                    placeholder="Enter contact number"
                  />
                </label>

                <label>
                  Emergency type
                  <select name="emergencyType" value={dialog.form.emergencyType} onChange={handleFieldChange}>
                    <option>Accident / Injury</option>
                    <option>High fever</option>
                    <option>Difficulty breathing</option>
                    <option>Pregnancy concern</option>
                    <option>Child illness</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Preferred hospital
                  <select name="hospitalId" value={dialog.form.hospitalId} onChange={handleFieldChange}>
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                    ))}
                  </select>
                </label>

                <label className="full-span">
                  Location
                  <input
                    name="location"
                    value={dialog.form.location}
                    onChange={handleFieldChange}
                    placeholder="Village or current address"
                  />
                </label>

                <label className="full-span">
                  Details / symptoms
                  <textarea
                    name="notes"
                    value={dialog.form.notes}
                    onChange={handleFieldChange}
                    rows="4"
                    placeholder="Describe the condition, urgency, or reason for visit"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="ghost-btn" onClick={closeDialog}>Cancel</button>
                <button type="submit" className="primary-btn">
                  {dialog.type === 'emergency' ? 'Submit request' : 'Confirm booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {result && (
        <div className="modal-backdrop" onClick={() => setResult(null)}>
          <div className="result-modal" onClick={(event) => event.stopPropagation()}>
            <div className={`result-icon ${result.kind}`}>{result.kind === 'success' ? '✓' : '!'}</div>
            <h3>{result.title}</h3>
            <p>{result.message}</p>
            <button className="primary-btn" onClick={() => setResult(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
