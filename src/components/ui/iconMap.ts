import {
  BarChart3, Camera, Compass, Globe, Heart, Layers, Lightbulb, Mail, Megaphone, MessageCircle, Palette, PenTool,
  Rocket, Search, Sparkles, Target, TrendingUp, Users, Video, Wand2, type LucideIcon,
} from 'lucide-react'

/** Icons the admin can pick from. Only these are bundled, which keeps the public site small. */
export const ICONS: Record<string, LucideIcon> = {
  Sparkles, Megaphone, BarChart3, Camera, Palette, Users, Mail, Video, Target, PenTool, Search, Globe,
  Lightbulb, Rocket, Heart, MessageCircle, TrendingUp, Layers, Compass, Wand2,
}
export const ICON_NAMES = Object.keys(ICONS)
export const getIcon = (name?: string): LucideIcon => (name && ICONS[name]) || Sparkles
