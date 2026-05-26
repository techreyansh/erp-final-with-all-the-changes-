import { supabase } from '../lib/supabaseClient';

const TABLES = {
  templates: 'task_templates',
  instances: 'task_instances',
  submissions: 'task_submissions',
  scores: 'user_scores',
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const taskComplianceService = {
  async generateForDate(targetDate = null) {
    const payload = targetDate ? { p_target_date: targetDate } : {};
    const { data, error } = await supabase.rpc('generate_task_instances_for_date', payload);
    if (error) throw error;
    return data ?? 0;
  },

  async listTaskInstances({
    date = null,
    userEmail = null,
    department = null,
    taskType = null,
    status = null,
    includeTemplate = true,
  } = {}) {
    let query = supabase
      .from(TABLES.instances)
      .select(
        includeTemplate
          ? '*, task_templates(id, task_name, department, task_type, required_proof, scoring_weight)'
          : '*'
      )
      .order('due_date', { ascending: true });

    if (date) query = query.eq('period_start_date', date);
    if (userEmail) query = query.eq('assigned_to_email', normalizeEmail(userEmail));
    if (status) query = query.eq('status', status);
    if (department) query = query.eq('task_templates.department', department);
    if (taskType) query = query.eq('task_templates.task_type', taskType);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async submitTask(taskInstanceId, { submissionLink = null, submissionNotes = null } = {}) {
    const { data, error } = await supabase.rpc('submit_task_instance', {
      p_task_instance_id: taskInstanceId,
      p_submission_link: submissionLink,
      p_submission_notes: submissionNotes,
    });
    if (error) throw error;
    return data;
  },

  async approveTask(taskInstanceId) {
    const { data, error } = await supabase.rpc('approve_task_instance', {
      p_task_instance_id: taskInstanceId,
    });
    if (error) throw error;
    return data;
  },

  async rejectTask(taskInstanceId, reason = '') {
    const { data, error } = await supabase.rpc('reject_task_instance', {
      p_task_instance_id: taskInstanceId,
      p_reason: reason || null,
    });
    if (error) throw error;
    return data;
  },

  subscribeToTaskRealtime({ onTaskChange, onScoreChange } = {}) {
    const channel = supabase
      .channel('task-compliance-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLES.instances },
        (payload) => onTaskChange?.(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLES.scores },
        (payload) => onScoreChange?.(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

export default taskComplianceService;
