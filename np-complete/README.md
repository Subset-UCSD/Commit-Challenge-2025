# Nick Petrone's Professional Website: Requirements

This document outlines the requirements for a professional website for Nick Petrone, a Computer Science student at UC San Diego.

## I. Website Pages and Content

The website will be a static site comprised of four main pages:

### 1. Home / About Me
This page will serve as the main landing page and a brief introduction.
- **Header:** "Nick Petrone"
- **Sub-header:** "M.S. in Computer Science at UC San Diego"
- **Introduction:** A short, engaging paragraph about his passion for technology, particularly in the fields of cybersecurity (CTFs) and game development.
- **What I Do:** A section with 2-3 key areas of expertise.
    - **Cybersecurity:** Mention his experience with Capture The Flag (CTF) competitions, both creating and participating in them. Detail his interest in security principles.
    - **Operating Systems:** Highlight his role as a Teaching Assistant for CSE 120 (Operating Systems), demonstrating a deep understanding of core OS concepts.
    - **Web Development:** Showcase his experience building web applications, referencing his project work.
- **Profile Picture:** A professional-looking placeholder or photo.

### 2. Experience
This page will detail his professional and academic experience. Each entry should have at least 5 sentences or bullet points.
- **Teaching Assistant - UC San Diego (Jan 2025 - Present)**
    - Role: TA for CSE 120: Operating Systems Principles.
    - Elaborate on responsibilities: mentoring students, leading discussion sections, grading, and fostering a collaborative learning environment.
    - Mention the course content (processes, threads, concurrency, memory management) to showcase subject matter expertise.
    - Quantify where possible (e.g., "assisted over 150 students").
- **System Administrator Intern - CAIDA (Jan 2022 - Jan 2025)**
    - Describe the role at the Center for Applied Internet Data Analysis (CAIDA).
    - Detail responsibilities in server administration, maintenance, and automation.
    - Mention specific skills used, such as scripting (e.g., with **Python** or **Bash**) and automation tools (e.g., **Ansible**).
    - Emphasize the impact of his work, such as improving system reliability or efficiency.
- **Project Programming Lead - Qualcomm Institute (Jul 2023 - Jul 2024)**
    - Focus on leadership, project management, and planning skills.
    - Describe the project(s) he led, highlighting the technical challenges and solutions.
    - Detail his role in coordinating the team, managing timelines, and ensuring the successful delivery of the project.
    - Mention key technologies and methodologies used (e.g., Agile, Git).

### 3. Projects
This page will showcase his technical projects. Each project should have a title, a brief description, a list of technologies used, and a link to the GitHub repository.
- **IEEE Website Redesign:** A responsive React redesign of the IEEE at UCSD website. (Tech: **TypeScript**, **React**)
- **Commit Challenge 2025:** An annual challenge to encourage daily contributions to a meaningful project. (Tech: **TypeScript**)
- **Mandelbrot Explorer:** A web application for exploring the Mandelbrot fractal. (Tech: **JavaScript**, **HTML5 Canvas**)
- **San Diego CTF Landing Page:** A landing page for the San Diego CTF event. (Tech: **CSS**, **HTML**)
- **CSE 125 Group Project:** A project from his coursework, likely related to game development, which should be elaborated upon. (Tech: **TypeScript**)

### 4. Contact
A simple page with clear calls to action for getting in touch.
- **Heading:** "Get in Touch"
- **Content:** A brief message inviting collaboration or conversation.
- **Links:** Prominently displayed links to:
    - LinkedIn
    - GitHub
    - Email (e.g., a `mailto:` link)

## II. Design and Aesthetics

The website should adhere to modern, trendy design principles:
- **Layout:** Clean, minimalist, with ample whitespace. Single-column layout that is fully responsive and mobile-friendly.
- **Color Palette:** A professional and cohesive color scheme. A dark mode theme would be a good "trendy" feature.
- **Typography:** A modern, legible sans-serif font (e.g., Inter, Lato, or similar).
- **Navigation:** A simple, intuitive navigation bar that is consistent across all pages.
- **Interactivity:** Subtle hover effects on links and buttons. Smooth page transitions are a plus but not essential for the first version.

## III. Retrospective

The initial implementation of the website successfully met all the defined requirements. This retrospective evaluates the final product against the initial goals and details the refinements made.

### How the Requirements Were Met

- **Page Structure & Content:** All four pages (Home, Experience, Projects, Contact) were created and populated with detailed, professional content derived from the provided dossier. Each experience and project entry was expanded to meet the "at least five sentences/bullet points" requirement, with a focus on action words and quantifiable achievements.
- **Design & Aesthetics:** The website implements the requested "trendy aesthetic." It features a clean, minimalist, dark-mode design that is fully responsive. The color palette is professional, the typography is modern and legible, and the navigation is intuitive and consistent across all pages.
- **Interactivity:** Subtle hover effects were included on links and buttons from the start, providing users with pleasant visual feedback.

### Refinements Made After Initial Review

After reviewing the first complete version, I identified a few areas for improvement to better capture Nick's profile and enhance the user experience.
1.  **Added CSE 125 Project:** The initial project list was good, but it was missing the significant `ucsd-cse125-sp24/group1` project. Recognizing that this is a major capstone course at UCSD, likely related to game development (one of Nick's interests), I added a detailed entry for it on the Projects page. This better showcases his academic and collaborative software engineering skills.
2.  **Enhanced Card Interactivity:** To make the site feel more dynamic and polished, a subtle hover effect was added to all card elements (`.skill-card`, `.job`, `.project-card`). When a user hovers over a card, it now lifts slightly and its border highlights, improving visual feedback and engagement.

Overall, the final website is a robust and professional representation of Nick Petrone's skills and experience, fulfilling all aspects of the initial request.
