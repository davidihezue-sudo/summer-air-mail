import type { ContentBundle } from './bundle'
import { hasValue } from '../utils/text'

export function getProjects(c: ContentBundle) {
  return c.projects
    .filter((p) => !p.hidden)
    .slice()
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

export function getCategories(c: ContentBundle) {
  return [...new Set(getProjects(c).map((p) => p.category))]
}

export function getCaseStudyProjects(c: ContentBundle) {
  return getProjects(c).filter((p) => p.caseStudy)
}

export function getServices(c: ContentBundle) {
  return c.services.filter((s) => !s.hidden)
}

export function getTools(c: ContentBundle) {
  return c.tools.filter((t) => t.confirmed && hasValue(t.usage))
}

export function getTestimonials(c: ContentBundle) {
  return c.testimonials
    .filter((t) => t.approved && hasValue(t.quote))
    .slice()
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

export function getContentItems(c: ContentBundle) {
  return c.contentItems.filter((i) => !i.hidden)
}

export function getWebsites(c: ContentBundle) {
  return c.websites.filter((w) => !w.hidden)
}

/** A section renders only when its flag is on AND it has real content to show. */
export function getVisibleSections(c: ContentBundle) {
  const f = c.portfolio.sections
  const p = c.portfolio
  const rec = p.recruiter
  const hasRecruiterData =
    rec.competencies.length + rec.platforms.length + rec.industries.length + rec.achievements.length +
      rec.education.length + rec.certifications.length + rec.employment.length > 0
  return {
    hero: f.showHero,
    recruiter: f.showRecruiterOverview && hasRecruiterData,
    about: f.showAbout,
    services: f.showServices && getServices(c).length > 0,
    work: f.showWork && getProjects(c).length > 0,
    caseStudies: f.showCaseStudies && getCaseStudyProjects(c).length > 0,
    tools: f.showTools && getTools(c).length > 0,
    content: f.showContentGallery && getContentItems(c).length > 0,
    strategy: f.showStrategy && p.strategy.steps.length > 0,
    websites: f.showWebsiteProjects && getWebsites(c).length > 0,
    testimonials: f.showTestimonials && getTestimonials(c).length > 0,
    mentoring: f.showMentoring && hasValue(p.mentoring.overview),
    contact: f.showContact,
  }
}

export type VisibleSections = ReturnType<typeof getVisibleSections>
