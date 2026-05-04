html,
body {
  padding: 0;
  margin: 0;
  font-family: system-ui, sans-serif;
  background: linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%);
  color: #111827;
  min-height: 100vh;
}

* {
  box-sizing: border-box;
}

button,
input,
select,
textarea {
  font: inherit;
}

/* ── NAV ── */
.nav {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 8px rgba(15, 23, 42, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 32px;
  height: 56px;
}

.nav-brand {
  font-weight: 700;
  font-size: 1rem;
  color: #111827;
  white-space: nowrap;
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 0.9rem;
  color: #4b5563;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #111827;
}

/* ── PAGE SHELL ── */
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 24px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.header h1 {
  margin: 0;
  font-size: clamp(1.8rem, 2.5vw, 2.6rem);
}

.header p {
  margin: 0;
  max-width: 760px;
  line-height: 1.7;
  color: #4b5563;
}

/* ── CARD ── */
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  padding: 24px;
  margin-bottom: 24px;
}

.card h2 {
  margin: 0 0 20px;
  font-size: 1.1rem;
  color: #111827;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header-row h2 {
  margin: 0;
}

/* ── TABS ── */
.tab-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 4px;
  width: fit-content;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.tab-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.tab-btn--active {
  background: #111827;
  color: #ffffff;
}

/* ── FORM ── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field.full,
.form-grid .field.full {
  grid-column: 1 / -1;
}

.field label {
  font-weight: 600;
  color: #111827;
  font-size: 0.9rem;
}

.label-hint {
  font-weight: 400;
  color: #9ca3af;
  font-size: 0.82rem;
}

.field input,
.field select,
.field textarea {
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 10px 14px;
  background: #fafafa;
  color: #111827;
  transition: border-color 0.15s;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #2563eb;
  background: #ffffff;
}

.field textarea {
  min-height: 100px;
  resize: vertical;
}

/* ── BUTTONS ── */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 22px;
  border: none;
  border-radius: 999px;
  background: #111827;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
  white-space: nowrap;
}

.button:hover {
  background: #1f2937;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-sm {
  padding: 7px 14px;
  font-size: 0.82rem;
}

.button-outline {
  background: transparent;
  border: 1.5px solid #d1d5db;
  color: #374151;
}

.button-outline:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.button-danger {
  background: #fee2e2;
  color: #b91c1c;
  border: none;
}

.button-danger:hover {
  background: #fecaca;
}

.btn-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* ── STUDENT CHIP SELECTOR ── */
.student-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.student-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 999px;
  cursor: pointer;
  background: #f9fafb;
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
}

.student-chip:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.student-chip--selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.chip-check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #2563eb;
  font-weight: 700;
  background: #fff;
  transition: border-color 0.15s;
}

.student-chip--selected .chip-check {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.chip-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #111827;
}

.chip-grade {
  font-size: 0.78rem;
  color: #9ca3af;
}

.selection-count {
  font-size: 0.85rem;
  color: #2563eb;
  font-weight: 600;
  margin: 4px 0 0;
}

/* ── STUDENT ENTRY BLOCK ── */
.student-entry-block {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 16px;
  background: #f9fafb;
}

.student-entry-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
}

.student-entry-name {
  font-weight: 700;
  font-size: 1rem;
  color: #111827;
}

.student-entry-grade {
  font-size: 0.82rem;
  color: #9ca3af;
  font-weight: 500;
}

/* ── ENTRIES (home page) ── */
.entry {
  border-top: 1px solid #e5e7eb;
  padding: 18px 0;
}

.entry:first-child {
  border-top: none;
}

.entry h3 {
  margin: 0 0 6px;
}

.entry-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 12px;
  color: #6b7280;
  font-size: 0.88rem;
}

.note {
  white-space: pre-line;
  margin: 16px 0 0;
  color: #374151;
  line-height: 1.6;
}

/* ── DATA TABLE ── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 2px solid #e5e7eb;
  font-weight: 600;
  color: #6b7280;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.data-table td {
  padding: 12px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #111827;
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

/* ── BADGE ── */
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 0.78rem;
  font-weight: 600;
}

/* ── INFO BANNER ── */
.info-banner {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 0.9rem;
  color: #1e40af;
  line-height: 1.6;
}

/* ── FEEDBACK ── */
.form-error {
  color: #b91c1c;
  margin: 12px 0 0;
  font-size: 0.9rem;
}

.form-success {
  color: #15803d;
  margin: 12px 0 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 32px 0;
  color: #9ca3af;
}

code {
  background: #f3f4f6;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.85em;
  color: #374151;
}

/* ── RESPONSIVE ── */
@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .tab-bar {
    width: 100%;
    justify-content: center;
  }

  .entry-meta {
    grid-template-columns: 1fr;
  }

  .nav-links {
    gap: 2px;
  }

  .nav-link {
    padding: 6px 10px;
    font-size: 0.82rem;
  }
}