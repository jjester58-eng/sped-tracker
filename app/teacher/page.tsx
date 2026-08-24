'use client';

import { useEffect, useState, useMemo } from 'react';
import SubjectSelector from '@/app/components/SubjectSelector';
import { useClassesAsSubjects } from '@/app/hooks/useClassesAsSubjects';
import { useSupabase } from '@/lib/useSupabase';
import type { Student } from '@/app/components/index';

type Teacher = {
  id: string;
  name: string;
};

const DEFAULT_PERIODS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const COMMON_ACCOMMODATIONS = [
  'Extended Time',
  'Oral Reading / Read Aloud',
  'Frequent Breaks',
  'Visual Aids / Organizers',
  'Small Group Setting',
  'Reduced Distractions',
  'Calculator / Formula Sheet',
  'Clarified Instructions',
];

const STARTER_TEMPLATES = [
  {
    title: '75% Proficiency',
    template: (studentName: string, subject: string, period: string) =>
      `75% of the time ${studentName} demonstrated proficiency in ${subject || 'the target skill'} during Period ${period || ''}.`,
  },
  {
    title: 'When Presented With',
    template: (studentName: string, subject: string) =>
      `When presented with ${subject || 'academic'} tasks, ${studentName} engaged productively and completed assigned work with minimal prompting.`,
  },
  {
    title: 'Student Demonstrates Progress',
    template: (studentName: string, subject: string) =>
      `${studentName} demonstrated positive progress in ${subject || 'target objectives'} and followed instructional guidelines.`,
  },
  {
    title: 'With Support',
    template: (studentName: string, subject: string) =>
      `With teacher support and guided prompts, ${studentName} successfully participated in ${subject || 'class'} activities.`,
  },
  {
    title: 'Accommodations Used',
    template: (studentName: string, _subject: string, _period: string, accs: string) =>
      `${studentName} utilized accommodations (${accs || 'prescribed supports'}) effectively to access the curriculum.`,
  },
  {
    title: 'Independent Mastery',
    template: (studentName: string, subject: string) =>
      `${studentName} worked independently on ${subject || 'assignments'} demonstrating comprehension of core concepts.`,
  },
];

export default function TeacherPage() {
  const supabase = useSupabase();

  const { subjects, loading: subjectsLoading } = useClassesAsSubjects();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classPeriods, setClassPeriods] = useState<string[]>(DEFAULT_PERIODS);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClassPeriod, setSelectedClassPeriod] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const [enteredByName, setEnteredByName] = useState('');

  const [subject, setSubject] = useState('');
  const [selectedAccommodations, setSelectedAccommodations] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [currentTimestamp, setCurrentTimestamp] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimestamp(
        now.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
          ' at ' +
          now.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('sped_tracker_entered_by');
      if (savedName) {
        setEnteredByName(savedName);
      }
    }
  }, []);

  const handleEnteredByNameChange = (value: string) => {
    setEnteredByName(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sped_tracker_entered_by', value);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingData(true);
      try {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id, name')
          .order('name');

        if (teacherData && teacherData.length > 0) {
          setTeachers(
            (teacherData as any[])
              .filter((t) => t.name)
              .map((t) => ({ id: t.id || t.name || "", name: t.name || "" }))
          );
        } else {
          setTeachers([
            { id: 'teacher-1', name: 'Coach / Teacher 1' },
            { id: 'teacher-2', name: 'Coach / Teacher 2' },
            { id: 'teacher-3', name: 'Coach / Teacher 3' },
          ]);
        }

        const { data: periodData } = await supabase
          .from('class_periods')
          .select('name, sort_order')
          .order('sort_order', { ascending: true });

        if (periodData && periodData.length > 0) {
          setClassPeriods((periodData as any[]).map((p) => p.name));
        }

        const { data: studentData, error: studentErr } = await supabase
          .from('students')
          .select('id, name, grade_level, is_active')
          .order('name');

        if (!studentErr && studentData) {
          const activeStudents = studentData.filter(
            (s: any) => s.is_active !== false
          );
          setAllStudents(activeStudents);
        }
      } catch (err) {
        console.error('Error loading initial teacher data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [supabase]);

  const filteredStudents = useMemo(() => {
    const term = studentSearchTerm.trim().toLowerCase();
    return allStudents.filter((student) => {
      const matchesSearch =
        !term ||
        student.name.toLowerCase().includes(term) ||
        (student.grade_level &&
          student.grade_level.toLowerCase().includes(term));
      const notAlreadySelected = !selectedStudents.some(
        (s) => s.id === student.id
      );
      return matchesSearch && notAlreadySelected;
    });
  }, [allStudents, studentSearchTerm, selectedStudents]);

  const handleAddStudent = (student: Student) => {
    setSelectedStudents((prev) => [...prev, student]);
    setStudentSearchTerm('');
    setShowStudentDropdown(false);
  };

  const handleRemoveStudent = (studentId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const handleSelectAllFiltered = () => {
    setSelectedStudents((prev) => [
      ...prev,
      ...filteredStudents.slice(0, 15),
    ]);
    setStudentSearchTerm('');
    setShowStudentDropdown(false);
  };

  const toggleAccommodation = (acc: string) => {
    setSelectedAccommodations((prev) =>
      prev.includes(acc) ? prev.filter((a) => a !== acc) : [...prev, acc]
    );
  };

  const handleAddStarter = (template: (typeof STARTER_TEMPLATES)[0]) => {
    const studentNamesText =
      selectedStudents.length === 1
        ? selectedStudents[0].name
        : selectedStudents.length > 1
        ? 'The selected students'
        : '[Student Name]';

    const accsText = selectedAccommodations.join(', ');

    const starterText = template.template(
      studentNamesText,
      subject || '',
      selectedClassPeriod || '',
      accsText
    );

    setNotes((prev) => (prev ? `${prev}\n\n${starterText}` : starterText));
  };

  const handleSave = async () => {
    if (!enteredByName.trim()) {
      alert('Please enter your name (person entering data).');
      return;
    }

    if (!selectedTeacher) {
      alert('Please select a teacher.');
      return;
    }

    if (!selectedClassPeriod) {
      alert('Please select a class period.');
      return;
    }

    if (selectedStudents.length === 0) {
      alert('Please select at least one student.');
      return;
    }

    if (!subject) {
      alert('Please select a subject.');
      return;
    }

    if (!notes.trim()) {
      alert('Please write observation/progress notes.');
      return;
    }

    setSaving(true);
    setSaveFeedback(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const nowIso = new Date().toISOString();
      const accsJoined = selectedAccommodations.join(', ');

      const teacherObj = teachers.find(
        (t) => t.id === selectedTeacher || t.name === selectedTeacher
      );

      // Resolve the free-text name to a UUID in data_entry_people.
      // Try to find an existing record first; if none, insert one.
      const trimmedName = enteredByName.trim();
      let enteredById: string | null = null;
      const { data: existingPerson } = await supabase
        .from('data_entry_people')
        .select('id')
        .ilike('name', trimmedName)
        .limit(1)
        .maybeSingle();

      if (existingPerson) {
        enteredById = existingPerson.id;
      } else {
        const { data: newPerson, error: insertPersonError } = await supabase
          .from('data_entry_people')
          .insert({ name: trimmedName })
          .select('id')
          .single();
        if (insertPersonError) throw insertPersonError;
        enteredById = newPerson.id;
      }

      const insertRows = selectedStudents.map((student) => {
        let studentNote = notes.trim();
        if (selectedStudents.length > 1) {
          studentNote = studentNote.replace(/The selected students/g, student.name);
          studentNote = studentNote.replace(/\[Student Name\]/g, student.name);
        }

        const fullNote = `[Recorded by: ${trimmedName} | Period: ${selectedClassPeriod} | ${currentTimestamp}]\n${studentNote}`;

        return {
          student_id: student.id,
          teacher_id: teacherObj ? teacherObj.id : null,
          entered_by_id: enteredById,
          class_period: String(selectedClassPeriod),
          progress_notes: fullNote,
          notes: fullNote,
          accommodations_used: accsJoined || null,
          review_date: today,
          week_of: today,
          created_at: nowIso,
          updated_at: nowIso,
        };
      });

      const { error } = await supabase.from('weekly_progress').insert(insertRows as any);

      if (error) throw error;

      setSaveFeedback({
        type: 'success',
        message: `✅ Successfully saved progress for ${selectedStudents.length} student${
          selectedStudents.length > 1 ? 's' : ''
        } at ${new Date().toLocaleTimeString()}!`,
      });

      setNotes('');
      setSelectedStudents([]);
      setStudentSearchTerm('');
      setSelectedAccommodations([]);

      setTimeout(() => {
        setSaveFeedback(null);
      }, 5000);
    } catch (err: any) {
      console.error('Error saving progress:', err);
      setSaveFeedback({
        type: 'error',
        message: `Error: ${err?.message || String(err)}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const draftWordCount = notes.trim().split(/\s+/).filter(Boolean).length;

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '2rem 1.5rem',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '1.25rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.75rem',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '1.25rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                }}
              >
                <span>📋</span>
                <span>Teacher & Staff Observation Portal</span>
              </div>
              <h1
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '0 0 0.4rem',
                }}
              >
                Student Progress Input
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                Document IEP progress, classroom observations, and accommodations.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '0.5rem 0.85rem',
                fontSize: '0.82rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>⏱️</span>
              <span><strong>Live Timestamp:</strong> {currentTimestamp || 'Loading...'}</span>
            </div>
          </div>

          {saveFeedback && (
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: saveFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: saveFeedback.type === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${saveFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              }}
            >
              <span>{saveFeedback.message}</span>
              <button
                onClick={() => setSaveFeedback(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.75rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '1rem',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>🎯</span> Class & Staff Information
              </h2>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  Person Entering Data (Your Name) *
                </label>
                <input
                  type="text"
                  value={enteredByName}
                  onChange={(e) => handleEnteredByNameChange(e.target.value)}
                  placeholder="e.g. Coach Smith, Ms. Davis, Paraprofessional..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.65rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    marginTop: '0.25rem',
                  }}
                >
                  <span>💾</span> Automatically saves to this device so you don&apos;t have to retype it.
                </span>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  Teacher *
                </label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.65rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select teacher...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  Class Period *
                </label>
                <select
                  value={selectedClassPeriod}
                  onChange={(e) => setSelectedClassPeriod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.65rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select class period...</option>
                  {classPeriods.map((p) => (
                    <option key={p} value={p}>
                      Period {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  Subject / Class *
                </label>
                <SubjectSelector
                  value={subject}
                  onChange={setSubject}
                  subjects={subjects}
                  loading={subjectsLoading}
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.35rem',
                  }}
                >
                  <label
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#334155',
                    }}
                  >
                    Select Student(s) * ({selectedStudents.length} selected)
                  </label>
                  {selectedStudents.length > 0 && (
                    <button
                      onClick={() => setSelectedStudents([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {selectedStudents.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      marginBottom: '0.6rem',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      padding: '0.35rem',
                      backgroundColor: '#ffffff',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {selectedStudents.map((s) => (
                      <span
                        key={s.id}
                        style={{
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        {s.name}
                        <button
                          onClick={() => handleRemoveStudent(s.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#1e40af',
                            fontWeight: 700,
                            padding: 0,
                            fontSize: '0.85rem',
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => {
                      setStudentSearchTerm(e.target.value);
                      setShowStudentDropdown(true);
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    placeholder="Type student name to auto-suggest..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />

                  {showStudentDropdown && filteredStudents.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #cbd5e1',
                        borderRadius: '0.65rem',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 20,
                        marginTop: '0.25rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <div
                        style={{
                          padding: '0.4rem 0.75rem',
                          backgroundColor: '#f1f5f9',
                          fontSize: '0.75rem',
                          color: '#475569',
                          fontWeight: 600,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>Matching Students ({filteredStudents.length})</span>
                        {filteredStudents.length > 1 && (
                          <button
                            onClick={handleSelectAllFiltered}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          >
                            + Add All Top Results
                          </button>
                        )}
                      </div>
                      {filteredStudents.slice(0, 30).map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleAddStudent(student)}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            color: '#0f172a',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = '#f8fafc')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = 'transparent')
                          }
                        >
                          <span style={{ fontWeight: 600 }}>{student.name}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Grade {student.grade_level || 'N/A'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '1rem',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>📝</span> Document Student Progress
                </h2>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Accommodations Used (Click to Toggle):
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.35rem',
                    }}
                  >
                    {COMMON_ACCOMMODATIONS.map((acc) => {
                      const isSelected = selectedAccommodations.includes(acc);
                      return (
                        <button
                          key={acc}
                          type="button"
                          onClick={() => toggleAccommodation(acc)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: isSelected
                              ? '1px solid #2563eb'
                              : '1px solid #cbd5e1',
                            backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                            color: isSelected ? '#1d4ed8' : '#475569',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {acc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#475569',
                      }}
                    >
                      Quick Sentence Starters:
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      (Click to insert into notes)
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                    }}
                  >
                    {STARTER_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.title}
                        type="button"
                        onClick={() => handleAddStarter(tmpl)}
                        style={{
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                          borderRadius: '999px',
                          padding: '0.45rem 0.8rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                          e.currentTarget.style.borderColor = '#93c5fd';
                          e.currentTarget.style.color = '#1d4ed8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#334155';
                        }}
                      >
                        + {tmpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#334155',
                      }}
                    >
                      Observation & Progress Notes *
                    </label>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {draftWordCount} words
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter detailed observation notes here or use the sentence starters above..."
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                      lineHeight: '1.5',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  disabled={saving || selectedStudents.length === 0}
                  onClick={handleSave}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    backgroundColor:
                      selectedStudents.length === 0 ? '#94a3b8' : '#2563eb',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor:
                      saving || selectedStudents.length === 0
                        ? 'not-allowed'
                        : 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {saving
                    ? 'Saving Observation...'
                    : selectedStudents.length > 1
                    ? `Save Observation for ${selectedStudents.length} Students`
                    : selectedStudents.length === 1
                    ? `Save Observation for ${selectedStudents[0].name}`
                    : 'Select Student(s) to Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}