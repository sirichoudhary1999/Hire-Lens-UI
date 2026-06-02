export const FORMAT_OPTIONS = [
  { value: 'standard', label: 'Standard Professional' },
  { value: 'ats', label: 'ATS Focused' },
  { value: 'minimal', label: 'Minimal One-Page' },
  { value: 'custom', label: 'Custom Format' }
];

export const DEFAULT_FORMAT = 'standard';

const BASE_FIELDS = {
  name: { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
  email: { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'john@example.com' },
  phone: { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1-555-0100' },
  location: { key: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
  linkedin: { key: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://linkedin.com/in/username' },
  summary: { key: 'summary', label: 'Professional Summary', type: 'textarea', rows: 4, placeholder: 'Short professional summary' },
  job_target: { key: 'job_target', label: 'Target Job Title', type: 'text', placeholder: 'Senior Backend Engineer' },
  achievements: { key: 'achievements', label: 'Top Achievements', type: 'textarea', rows: 3, placeholder: '3 key achievements' }
};

const SKILL_FIELDS = {
  technical: { key: 'technical', label: 'Technical Skills', placeholder: 'React, Python, SQL' },
  soft: { key: 'soft', label: 'Soft Skills', placeholder: 'Communication, Mentorship' },
  languages: { key: 'languages', label: 'Languages', placeholder: 'English, Spanish' },
  tools: { key: 'tools', label: 'Tools', placeholder: 'Docker, GitHub Actions' },
  keywords: { key: 'keywords', label: 'ATS Keywords', placeholder: 'Microservices, CI/CD, Kubernetes' }
};

const LIST_SECTIONS = {
  experiences: { key: 'experiences', label: 'Experience Bullet Points', placeholder: 'Built a REST API that reduced response time by 35%' },
  education: { key: 'education', label: 'Education Entries', placeholder: 'B.Tech in CSE - ABC University - 2024' },
  projects: { key: 'projects', label: 'Projects', placeholder: 'Inventory platform, React + Flask, 20k users' },
  certifications: { key: 'certifications', label: 'Certifications', placeholder: 'AWS Certified Developer Associate' }
};

export const CORE_LIST_SECTIONS = [
  LIST_SECTIONS.experiences,
  LIST_SECTIONS.education,
  LIST_SECTIONS.projects,
  LIST_SECTIONS.certifications
];

export const FORMAT_DEFINITIONS = {
  standard: {
    description: 'Balanced format for most applications',
    personalFields: [BASE_FIELDS.name, BASE_FIELDS.email, BASE_FIELDS.phone, BASE_FIELDS.location, BASE_FIELDS.linkedin, BASE_FIELDS.summary],
    skillFields: [SKILL_FIELDS.technical, SKILL_FIELDS.soft, SKILL_FIELDS.languages, SKILL_FIELDS.tools],
    listSections: [LIST_SECTIONS.experiences, LIST_SECTIONS.education, LIST_SECTIONS.projects, LIST_SECTIONS.certifications]
  },
  ats: {
    description: 'Keyword-heavy structure for ATS systems',
    personalFields: [BASE_FIELDS.name, BASE_FIELDS.email, BASE_FIELDS.phone, BASE_FIELDS.location, BASE_FIELDS.linkedin, BASE_FIELDS.job_target, BASE_FIELDS.summary, BASE_FIELDS.achievements],
    skillFields: [SKILL_FIELDS.technical, SKILL_FIELDS.tools, SKILL_FIELDS.keywords],
    listSections: [LIST_SECTIONS.experiences, LIST_SECTIONS.projects, LIST_SECTIONS.certifications]
  },
  minimal: {
    description: 'Clean compact format for concise profiles',
    personalFields: [BASE_FIELDS.name, BASE_FIELDS.email, BASE_FIELDS.phone, BASE_FIELDS.summary],
    skillFields: [SKILL_FIELDS.technical],
    listSections: [LIST_SECTIONS.experiences]
  },
  custom: {
    description: 'Build your own structure with custom fields',
    personalFields: [BASE_FIELDS.name, BASE_FIELDS.email, BASE_FIELDS.summary],
    skillFields: [SKILL_FIELDS.technical],
    listSections: [LIST_SECTIONS.experiences]
  }
};

export const defaultResumeData = {
  title: 'My Resume',
  is_primary: false,
  personal_info: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    summary: '',
    resume_format: 'standard',
    custom_field_defs: [],
    custom_fields: {}
  },
  skills: {
    technical: [],
    soft: [],
    languages: [],
    tools: [],
    keywords: []
  },
  experiences: [],
  education: [],
  projects: [],
  certifications: []
};

export const listToText = (items) => {
  if (!Array.isArray(items)) {
    return '';
  }

  return items
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (item && typeof item === 'object') {
        return item.description || item.title || item.name || item.degree || item.certification || '';
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');
};

export const textToList = (text, sectionKey) => {
  const lines = (text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (sectionKey === 'experiences') {
    return lines.map((line) => ({ description: line }));
  }
  if (sectionKey === 'education') {
    return lines.map((line) => ({ degree: line }));
  }
  if (sectionKey === 'projects') {
    return lines.map((line) => ({ title: line }));
  }
  if (sectionKey === 'certifications') {
    return lines.map((line) => ({ certification: line }));
  }
  return lines;
};

export const skillsArrayToText = (skillsMap, key) => {
  const values = skillsMap?.[key];
  return Array.isArray(values) ? values.join(', ') : '';
};

export const skillsTextToArray = (text) => {
  return (text || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const normalizeResumeFormat = (value) => {
  const selected = (value || '').toLowerCase();
  const validValues = FORMAT_OPTIONS.map((option) => option.value);
  return validValues.includes(selected) ? selected : DEFAULT_FORMAT;
};
