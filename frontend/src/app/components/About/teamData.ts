import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TeamMemberLink = {
  label: string;
  href: string;
  Icon: LucideIcon;
};

export type TeamMember = {
  name: string;
  role: string;
  focus: string;
  bio: string;
  imageUrl?: string;
  links: TeamMemberLink[];
};

export type TeamValue = {
  title: string;
  description: string;
};

export const teamMembers: TeamMember[] = [
  {
    name: "Tinashe Kucherera",
    role: "Architect",
    focus: "Platform, AI systems, and community strategy",
    bio: "Building SABHUKU AI as a practical home for African AI models, datasets, tutorials, and deployment workflows.",
    imageUrl: "https://storage.googleapis.com/sabhuku-media/our-team/Screenshot%20from%202026-05-11%2015-31-55.png",
    links: [
      { label: "GitHub", href: "https://github.com/Tkucherera", Icon: Github },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/tinashe-kucherera/", Icon: Linkedin },
      /*{ label: "Email", href: "mailto:hello@sabhuku.com", Icon: Mail } ,*/
    ],
  },
 
];

export const teamValues: TeamValue[] = [
  {
    title: "Local Context",
    description: "We prioritize AI systems that understand local languages, constraints, data realities, and deployment needs.",
  },
  {
    title: "Open Contribution",
    description: "The platform grows through shared models, datasets, tutorials, and honest technical feedback.",
  },
  {
    title: "Production Mindset",
    description: "Research matters, but the goal is usable tooling that teams can trust in real workflows.",
  },
];
