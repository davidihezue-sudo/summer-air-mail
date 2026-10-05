import {
  BarChart3, Bot, Briefcase, Calendar, Clapperboard, Compass, FileText, Film, Globe, Image as ImageIcon, LayoutDashboard, Layers,
  LayoutList, Link2, ListChecks, Megaphone, MessageSquareQuote, Palette, PenTool, Rocket, Search, Settings, Share2, Sparkles, Target, User, Wrench,
  Laptop, Mail, Camera, MousePointer2, Brush, Megaphone as Horn, Languages, Inbox, Users, BarChart, ShieldCheck, FileDown, Files, Link as LinkIcon, Route, NotebookPen, Bookmark, Wand2, Timer, HardDrive, UserSquare, Type, ClipboardCheck, BookOpen, Star, Workflow, Cpu, Footprints, Eye, PartyPopper, Monitor, TrendingUp,
} from 'lucide-react'

export const NAV: { group: string; items: { id: string; label: string; icon: typeof User; owner?: boolean }[] }[] = [
  { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { group: 'Identity', items: [
    { id: 'profile', label: 'Personal Profile', icon: User }, { id: 'about', label: 'About & Recruiter Overview', icon: BookOpen }, { id: 'hero', label: 'Hero', icon: Rocket },
    { id: 'cv', label: 'Resume / CV', icon: FileText }, { id: 'social', label: 'Social Links', icon: Share2 }, { id: 'contact', label: 'Contact', icon: Mail },
  ] },
  { group: 'Look and layout', items: [
    { id: 'appearance', label: 'Appearance', icon: Palette }, { id: 'cursor', label: 'Cursor effect', icon: MousePointer2 }, { id: 'seasons', label: 'Seasons', icon: Calendar }, { id: 'celebrations', label: 'Celebrations', icon: PartyPopper }, { id: 'sections', label: 'Sections & Visibility', icon: ListChecks },
    { id: 'design', label: 'Design', icon: Brush }, { id: 'extras', label: 'Extras', icon: Wand2 }, { id: 'looks', label: 'Saved Looks', icon: Bookmark },
    { id: 'navigation', label: 'Navigation', icon: Compass }, { id: 'footer', label: 'Footer', icon: Footprints },
  ] },
  { group: 'Reach and engagement', items: [
    { id: 'applications', label: 'Application Links', icon: UserSquare }, { id: 'profilePage', label: 'One Page Profile', icon: FileDown }, { id: 'shortLinks', label: 'Short Links', icon: LinkIcon },
    { id: 'notes', label: 'Notes (blog)', icon: NotebookPen }, { id: 'journey', label: 'Career Journey', icon: Route }, { id: 'resources', label: 'Resources', icon: Files },
    { id: 'engage', label: 'Booking & Newsletter', icon: Horn }, { id: 'announcement', label: 'Banner & Schedule', icon: Timer }, { id: 'languages', label: 'Languages', icon: Languages },
    { id: 'maintenance', label: 'Maintenance & 404', icon: Type },
  ] },
  { group: 'Messages and insight', items: [
    { id: 'inbox', label: 'Inbox', icon: Inbox }, { id: 'subscribers', label: 'Subscribers', icon: Users }, { id: 'insights', label: 'Visit Insights', icon: BarChart },
    { id: 'qualityScore', label: 'Quality Score', icon: ClipboardCheck },
  ] },
  { group: 'Tools', items: [
    { id: 'bulk', label: 'Bulk & CSV', icon: Files }, { id: 'altText', label: 'Alt Text Assistant', icon: Wand2 }, { id: 'quality', label: 'Quality Rules', icon: ShieldCheck },
    { id: 'team', label: 'Team & Access', icon: Users, owner: true }, { id: 'server', label: 'Server & Backups', icon: HardDrive, owner: true },
  ] },
  { group: 'Portfolio', items: [
    { id: 'projects', label: 'Portfolio', icon: Briefcase },
    { id: 'posts', label: 'Social Media Content', icon: Camera }, { id: 'screenshots', label: 'Screenshots', icon: Monitor }, { id: 'mediaDisplay', label: 'Picture Display', icon: ImageIcon },
    { id: 'results', label: 'Analytics & Results', icon: BarChart3 }, { id: 'resultsDisplay', label: 'Results Display', icon: TrendingUp }, { id: 'websites', label: 'Websites & Digital Projects', icon: Laptop },
  ] },
  { group: 'Capabilities', items: [
    { id: 'services', label: 'Services', icon: Layers }, { id: 'skills', label: 'Skills', icon: Star }, { id: 'platforms', label: 'Platform Expertise', icon: Globe },
    { id: 'tools', label: 'Tools & Platforms', icon: Wrench }, { id: 'toolsDisplay', label: 'Tools Display', icon: Brush }, { id: 'ai', label: 'AI & Automation', icon: Cpu }, { id: 'process', label: 'Marketing Process', icon: Workflow },
    { id: 'strategy', label: 'Strategy Framework', icon: Target }, { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote }, { id: 'mentoring', label: 'Mentoring & Training', icon: PenTool },
  ] },
  { group: 'Publish', items: [
    { id: 'media', label: 'Media Library', icon: ImageIcon }, { id: 'publish', label: 'Preview & Publish', icon: Eye }, { id: 'seo', label: 'SEO', icon: Search },
    { id: 'analytics', label: 'Analytics Tracking', icon: Sparkles }, { id: 'advanced', label: 'Advanced Settings', icon: Settings },
  ] },
]

void [Bot, LayoutList, Link2, Megaphone, Film, Clapperboard]
