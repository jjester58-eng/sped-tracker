'use client';

import { useEffect, useState } from 'react';
import SubjectSelector from '@/app/components/SubjectSelector';
import GradeLevelMultiSelector from '@/app/components/GradeLevelMultiSelector';
import { useClassesAsSubjects } from '@/app/hooks/useClassesAsSubjects';
import { useSupabase } from '@/lib/useSupabase';
import type { Student } from '@/app/components/index';

type CaseManager = {
  id: string;
  name: string;
};

const STARTER_TEMPLATES = [
  {
    title: '75% proficiency',
    template: (studentName: string, subject: string) => 
      `75% of the time ${studentName} ${subject ? `demonstrates proficiency in ${subject}` : 'demonstrates target behavior'}`,
  },
  {
    title: 'When presented with',
    template: (studentName: string, subject: string) => 
      `When presented with ${subject || 'academic'} tasks, ${studentName}`,
  },
  {
    title: 'Student demonstrates',
    template: (studentName: string, subject: string) => 
      `${studentName} demonstrates ${subject ? `understanding of ${subject}` : 'progress toward goal'}`,
  },
  {
    title: 'With support',
    template: (studentName: string, subject: string) => 
      `With teacher support, ${studentName} ${subject ? `engages in ${subject}` : 'participates in activities'}`,
  },
  {
    title: 'Progress in',
    template: (studentName: string, subject: string) => 
      `${studentName} has shown progress in ${subject || 'the target skill'}`,
  },
];

export default function CaseManagerPage() {
  const supabase = useSupabase();
  const { subjects, loading: subjectsLoading } = useClassesAsSubjects();

  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
  const [selectedCaseManager, setSelectedCaseManager] = useState('');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load case managers
  useEffect(() => {
    const loadCaseManagers = async () => {
      const { data, error } = await supabase
        .from('case_managers')
        .select('id, name')
        .order('name');
      
      if (!error && data) {
        setCaseManagers(data);
      }
    };
    
    loadCaseManagers();
  }, []);

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, grade_level')
        .order('name');
      
      if (!error && data) {
        setAllStudents(data);
      }
    };
    
    loadStudents();
  }, []);

  // Filter students based on search term
  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearchTerm(student.name);
    setShowStudentDropdown(false);
  };

  const handleAddStarter = (template: typeof STARTER_TEMPLATES[0]) => {
    const starterText = template.template(
      selectedStudent?.name || '[Student Name]',
      subject || ''
    );
    setNotes((prev) => prev ? `${prev}\n\n${starterText}` : starterText);
  };

  const handleSave = async () => {
    if (!selectedCaseManager) {
      alert('Please select a case manager.');
      return;
    }

    if (!selectedStudent) {
      alert('Please select a student.');
      return;
    }

    if (!subject) {
      alert('Please select a subject.');
      return;
    }

    if (!notes.trim()) {
      alert('Please write notes.');
      return;
    }

    setSaving(true);
    setSaveFeedback(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('weekly_progress').insert({
        student_id: selectedStudent.id,
        case_manager_id: selectedCaseManager,
        progress_notes: notes.trim(),
        notes: notes.trim(),
        review_date: today,
        week_of: today,
      } as any);

      if (error) throw error;

      setSaveFeedback({ type: 'success', message: '✅ Notes saved successfully!' });
      setNotes('');
      setSelectedStudent(null);
      setStudentSearchTerm('');
      setSubject('');
      setSelectedGradeLevels([]);
      
      setTimeout(() => setSaveFeedback(null), 3000);
    } catch (err) {
      console.error('Error:', err);
      setSaveFeedback({ 
        type: 'error', 
        message: `Error: ${err instanceof Error ? err.message : String(err)}` 
      });
    } finally {
      setSaving(false);
    }
  };

  const draftWordCount = notes.trim().split(/\s+/).filter(Boolean).length;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "2.5rem 1.5rem" }}>
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <div style={{ backgroundColor: "white", borderRadius: "1.5rem", padding: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          {/* Header */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", backgroundColor: "#eff6ff", color: "#2563eb", padding: "0.35rem 0.7rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.6rem" }}>
              <span>📋</span>
              <span>Case Manager workflow</span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#111827", margin: "0 0 0.5rem" }}>
              Case Manager Input
            </h1>
            <p style={{ color: "#374151", fontSize: "0.95rem", margin: 0 }}>
              Document student progress and observations with personalized note starters.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
            {/* Filters Section */}
            <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "1.25rem", padding: "1.25rem" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>Filters & Selection</h2>
              
              {/* Case Manager Dropdown */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.95rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>
                  Case Manager *
                </label>
                <select
                  value={selectedCaseManager}
                  onChange={(e) => setSelectedCaseManager(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#f9fafb",
                    color: "#111827",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select a case manager...</option>
                  {caseManagers.map((cm) => (
                    <option key={cm.id} value={cm.id}>
                      {cm.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Autocomplete */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.95rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>
                  Student *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => {
                      setStudentSearchTerm(e.target.value);
                      setShowStudentDropdown(true);
                      if (!allStudents.find(s => s.name === e.target.value)) {
                        setSelectedStudent(null);
                      }
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    placeholder="Search or select student..."
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.75rem",
                      border: "1px solid #d1d5db",
                      backgroundColor: "#f9fafb",
                      color: "#111827",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                  {showStudentDropdown && filteredStudents.length > 0 && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "white",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.75rem",
                      maxHeight: "200px",
                      overflowY: "auto",
                      zIndex: 10,
                      marginTop: "0.25rem",
                    }}>
                      {filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleSelectStudent(student)}
                          style={{
                            width: "100%",
                            padding: "0.75rem 1rem",
                            border: "none",
                            backgroundColor: "transparent",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "0.95rem",
                            color: "#111827",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          {student.name} {student.grade_level ? `(Grade ${student.grade_level})` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedStudent && (
                  <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "0.4rem 0.8rem", borderRadius: "999px", fontSize: "0.85rem", fontWeight: 600 }}>
                      {selectedStudent.name}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedStudent(null);
                        setStudentSearchTerm('');
                      }}
                      style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.95rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>
                  Subject *
                </label>
                <SubjectSelector
                  value={subject}
                  onChange={setSubject}
                  subjects={subjects}
                  loading={subjectsLoading}
                />
              </div>

              {/* Grade Level (Optional) */}
              <div>
                <label style={{ display: "block", fontSize: "0.95rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>
                  Grade Level (Optional)
                </label>
                <GradeLevelMultiSelector
                  value={selectedGradeLevels}
                  onChange={setSelectedGradeLevels}
                />
              </div>
            </div>

            {/* Entry Section */}
            {selectedStudent && subject ? (
              <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "1.25rem", padding: "1.25rem" }}>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>Start Entry</h2>
                
                {/* Quick Starters */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.75rem", marginTop: 0 }}>
                    Quick starters personalized for <strong>{selectedStudent.name}</strong> in <strong>{subject}</strong>:
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {STARTER_TEMPLATES.map((template) => (
                      <button
                        key={template.title}
                        onClick={() => handleAddStarter(template)}
                        style={{
                          border: "1px solid #d1d5db",
                          backgroundColor: "#fff",
                          borderRadius: "999px",
                          padding: "0.6rem 1rem",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "#374151",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f3f4f6";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#9ca3af";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
                        }}
                      >
                        {template.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes Textarea */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <label style={{ display: "block", fontWeight: 700, color: "#111827", fontSize: "0.95rem", margin: 0 }}>
                      Observations & Notes *
                    </label>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {draftWordCount} word{draftWordCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: "280px",
                      padding: "0.9rem 1rem",
                      borderRadius: "0.75rem",
                      border: "1px solid #d1d5db",
                      resize: "vertical",
                      backgroundColor: "white",
                      color: "#374151",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    placeholder="Write detailed observations, progress notes, behavior, and recommendations..."
                  />
                </div>

                {/* Feedback Message */}
                {saveFeedback && (
                  <div style={{
                    marginTop: "1rem",
                    borderRadius: "0.75rem",
                    padding: "0.8rem 1rem",
                    fontSize: "0.9rem",
                    border: saveFeedback.type === "success" ? "1px solid #a7f3d0" : "1px solid #fecaca",
                    backgroundColor: saveFeedback.type === "success" ? "#f0fdf4" : "#fef2f2",
                    color: saveFeedback.type === "success" ? "#166534" : "#b91c1c",
                  }}>
                    {saveFeedback.message}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={handleSave}
                    disabled={saving || !notes.trim()}
                    style={{
                      flex: 1,
                      backgroundColor: "#2563eb",
                      color: "white",
                      padding: "0.9rem 1.25rem",
                      borderRadius: "0.75rem",
                      border: "none",
                      cursor: saving || !notes.trim() ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      opacity: saving || !notes.trim() ? 0.6 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {saving ? "Saving..." : "Save Notes"}
                  </button>
                  <button
                    onClick={() => {
                      setNotes('');
                      setSaveFeedback(null);
                    }}
                    style={{
                      backgroundColor: "white",
                      color: "#374151",
                      padding: "0.9rem 1.25rem",
                      borderRadius: "0.75rem",
                      border: "1px solid #d1d5db",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: "#f9fafb",
                border: "1px dashed #d1d5db",
                borderRadius: "1.25rem",
                padding: "2rem",
                textAlign: "center",
                minHeight: "320px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📝</div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", margin: 0 }}>Ready to document?</h3>
                <p style={{ marginTop: "0.5rem", color: "#6b7280", fontSize: "0.95rem" }}>
                  {!selectedStudent
                    ? "Select a student to begin writing observations."
                    : "Select a subject to see personalized note starters."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}