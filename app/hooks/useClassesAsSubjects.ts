'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/useSupabase';

export type Subject = {
  id: string;
  name: string;
};

export function useClassesAsSubjects() {
  const supabase = useSupabase();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, class_name')
        .order('class_name');

      if (!error && data) {
        setSubjects(
          data.map((c) => ({
            id: c.id,
            name: c.class_name,
          }))
        );
      }

      setLoading(false);
    };

    load();
  }, [supabase]);

  return { subjects, loading };
}