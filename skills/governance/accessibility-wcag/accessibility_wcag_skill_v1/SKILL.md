---
name: accessibility_wcag_skill_v1
description: WCAG 2.1/2.2 accessibility compliance, screen reader support, keyboard navigation, and inclusive design patterns for web and mobile applications
version: 1.0.0
tags: [accessibility, wcag, a11y, screen-reader, keyboard, inclusive-design, compliance]
stack: accessibility/framework-agnostic
category: governance
triggers:
  keywords: [accessibility, wcag, a11y, screen reader, keyboard navigation, aria, accessibility audit]
  filePatterns: [*.tsx, *.vue, *.html, *.jsx]
  commands: [axe-core, lighthouse, pa11y, accessibility-insights]
  stack: accessibility/framework-agnostic
  projectArchetypes: [public-website, ecommerce, saas, government, education]
  modes: [greenfield, audit, compliance]
prerequisites:
  - html_css_fundamentals
  - javascript_basics
  - dom_manipulation
recommended_structure:
  directories:
    - src/components/a11y/
    - src/hooks/a11y/
    - src/utils/a11y/
    - tests/accessibility/
    - docs/accessibility/
workflow:
  setup:
    - Run accessibility audit (axe, Lighthouse)
    - Document current issues
    - Set up CI/CD accessibility checks
    - Train team on accessibility basics
  implement:
    - Add semantic HTML
    - Implement keyboard navigation
    - Add ARIA labels and roles
    - Ensure color contrast compliance
  test:
    - Screen reader testing (NVDA, VoiceOver)
    - Keyboard-only navigation
    - Automated testing (axe-core)
    - User testing with disabled users
best_practices:
  - Use semantic HTML elements (nav, main, article, section)
  - Provide alt text for all images
  - Ensure sufficient color contrast (4.5:1 for text)
  - Make all functionality keyboard accessible
  - Add skip links for navigation
  - Use ARIA only when native HTML is insufficient
  - Provide focus indicators for interactive elements
  - Ensure form inputs have associated labels
  - Test with multiple screen readers
  - Implement proper heading hierarchy (h1-h6)
anti_patterns:
  - Never use div/span when semantic HTML exists
  - Don't remove focus outlines without alternatives
  - Avoid placeholder as sole label
  - Don't use color alone to convey information
  - Never trap keyboard focus
  - Avoid auto-playing media with sound
  - Don't skip heading levels
  - Never use accessibility: hidden to hide content from screen readers
  - Avoid generic link text (click here, read more)
  - Don't ignore motion/vestibular preferences
scaling_notes: |
  For enterprise-scale accessibility:

  **Governance:**
  - Establish accessibility policy and standards
  - Appoint accessibility champions per team
  - Create component library with a11y built-in
  - Document accessibility patterns

  **Testing:**
  - Automated testing in CI/CD pipeline
  - Regular manual testing schedule
  - Screen reader testing rotation
  - User testing with disabled participants

  **Training:**
  - Mandatory accessibility training for all developers
  - Designer training on inclusive design
  - Content team training on accessible content
  - Regular knowledge sharing sessions

  **Monitoring:**
  - Continuous monitoring with automated tools
  - Regular third-party audits
  - User feedback channels for accessibility issues
  - Track accessibility metrics in dashboards

  **Compliance:**
  - Document WCAG conformance level (A, AA, AAA)
  - Create VPAT (Voluntary Product Accessibility Template)
  - Maintain accessibility statement
  - Regular compliance reviews

when_not_to_use: |
  This skill provides general guidance. Consider specialized expertise for:

  **Legal Compliance:**
  - Government contracts may require specific compliance
  - Healthcare (HIPAA) has accessibility requirements
  - Education (Section 508) has specific standards

  **Specialized Accessibility:**
  - Cognitive accessibility requires specialized knowledge
  - Deaf-blind communication needs expert input
  - Motor impairment accommodations vary widely

output_template: |
  ## Accessibility Compliance Decision

  **Standard:** WCAG 2.1 Level AA
  **Testing:** Automated + Manual + Screen Reader
  **Compliance:** VPAT Documented

  ### Key Decisions
  - **Navigation:** Skip links + keyboard accessible
  - **Forms:** Floating labels with error announcements
  - **Colors:** 4.5:1 contrast minimum
  - **Media:** Captions + audio descriptions

  ### Trade-offs Considered
  - Native HTML vs ARIA: Native preferred
  - Visual design vs Accessibility: Both achievable
  - Automation vs Manual: Both required

  ### Next Steps
  1. Run accessibility audit
  2. Fix critical issues
  3. Implement keyboard navigation
  4. Test with screen readers
  5. Document conformance
dependencies:
  testing_tools:
    - axe-core (automated testing)
    - @axe-core/react (React testing)
    - jest-axe (Jest integration)
    - lighthouse (performance + a11y)
    - pa11y (CLI testing)
    - accessibility-insights (Microsoft)
  screen_readers:
    - NVDA (Windows, free)
    - JAWS (Windows, paid)
    - VoiceOver (macOS/iOS, built-in)
    - TalkBack (Android, built-in)
  libraries:
    - @reach/skip-nav (skip links)
    - react-aria (Adobe accessibility hooks)
    - @radix-ui/react (accessible components)
    - focus-trap-react (focus management)
---

<role>
You are an accessibility specialist with deep expertise in WCAG 2.1/2.2 guidelines, screen reader behavior, keyboard navigation patterns, and inclusive design. You provide structured guidance on making applications accessible to all users following industry best practices and legal requirements.
</role>

<execution_flow>
1. **Accessibility Audit**
   - Run automated tools (axe, Lighthouse)
   - Conduct manual keyboard testing
   - Test with screen readers
   - Document issues by severity

2. **Semantic HTML Implementation**
   - Replace div/span with semantic elements
   - Implement proper heading hierarchy
   - Add landmarks (nav, main, aside, footer)
   - Use native interactive elements

3. **Keyboard Navigation**
   - Ensure all interactive elements focusable
   - Implement logical tab order
   - Add keyboard shortcuts for common actions
   - Implement focus management for modals

4. **ARIA Implementation**
   - Add ARIA labels where needed
   - Implement live regions for dynamic content
   - Use ARIA roles for custom components
   - Ensure ARIA attributes are kept in sync

5. **Visual Accessibility**
   - Ensure color contrast compliance
   - Provide text alternatives
   - Implement focus indicators
   - Support reduced motion preferences

6. **Testing & Validation**
   - Screen reader testing
   - Keyboard-only testing
   - Automated testing in CI/CD
   - User testing with disabled users
</execution_flow>

<wcag_principles>
**WCAG 2.1/2.2 Principles (POUR):**

### 1. Perceivable

Information and user interface components must be presentable to users in ways they can perceive.

```html
<!-- ✅ GOOD: Text alternative for images -->
<img src="chart.png" alt="Sales increased 25% in Q4 2024" />

<!-- ✅ GOOD: Decorative image -->
<img src="decorative-border.png" alt="" role="presentation" />

<!-- ✅ GOOD: Video with captions -->
<video controls>
  <source src="video.mp4" type="video/mp4" />
  <track kind="captions" src="captions.vtt" srclang="en" label="English" />
  <track kind="descriptions" src="descriptions.vtt" srclang="en" label="Audio Descriptions" />
</video>

<!-- ✅ GOOD: Sufficient color contrast -->
<!-- Text color #333333 on white #FFFFFF = 12.63:1 contrast ratio -->
<p style="color: #333333; background-color: #FFFFFF;">
  This text is readable
</p>

<!-- ✅ GOOD: Don't rely on color alone -->
<!-- Error state with icon and text, not just red color -->
<div class="error" role="alert">
  <span class="icon" aria-hidden="true">⚠️</span>
  <span class="message">Invalid email format</span>
</div>
```

### 2. Operable

User interface components and navigation must be operable by all users.

```html
<!-- ✅ GOOD: Skip link for keyboard users -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<!-- ✅ GOOD: Keyboard accessible custom button -->
<div 
  role="button"
  tabindex="0"
  onclick="handleClick()"
  onkeydown="handleKeyDown(event)"
  aria-pressed="false"
>
  Toggle Button
</div>

<script>
function handleKeyDown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick();
  }
}
</script>

<!-- ✅ GOOD: Focus management in modal -->
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">Confirm Action</h2>
  <p>Are you sure you want to proceed?</p>
  <button onclick="confirm()">Confirm</button>
  <button onclick="cancel()">Cancel</button>
</div>

<script>
// Trap focus within modal
const focusableElements = modal.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
const firstFocusable = focusableElements[0];
const lastFocusable = focusableElements[focusableElements.length - 1];

modal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }
  if (e.key === 'Escape') {
    closeModal();
  }
});
</script>

<!-- ✅ GOOD: No keyboard trap -->
<!-- Users can navigate away from all components -->

<!-- ✅ GOOD: Sufficient time or ability to extend -->
<div role="alert" aria-live="polite">
  Your session will expire in <span id="timer">5</span> minutes.
  <button onclick="extendSession()">Extend Session</button>
</div>
```

### 3. Understandable

Information and the operation of user interface must be understandable.

```html
<!-- ✅ GOOD: Clear form labels -->
<label for="email">
  Email address
  <input 
    type="email" 
    id="email" 
    name="email" 
    required
    aria-describedby="email-error"
    aria-invalid="true"
  />
  <span id="email-error" role="alert">
    Please enter a valid email address (e.g., name@example.com)
  </span>
</label>

<!-- ✅ GOOD: Consistent navigation -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/" aria-current="page">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>

<!-- ✅ GOOD: Predictable behavior -->
<!-- No unexpected changes on focus or hover -->
<input 
  type="text" 
  label="Search"
  onChange={handleSearch}  // Search on change, not on blur
/>

<!-- ✅ GOOD: Input assistance -->
<form>
  <label for="phone">
    Phone number
    <input 
      type="tel"
      id="phone"
      pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
      placeholder="123-456-7890"
      aria-describedby="phone-format"
    />
    <span id="phone-format">Format: 123-456-7890</span>
  </label>
</form>
```

### 4. Robust

Content must be robust enough to be interpreted by a wide variety of user agents.

```html
<!-- ✅ GOOD: Valid HTML -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Accessible Page</title>
</head>
<body>
  <header>
    <nav aria-label="Main navigation">
      <!-- Navigation content -->
    </nav>
  </header>
  
  <main id="main-content">
    <h1>Page Title</h1>
    <article>
      <h2>Section Heading</h2>
      <p>Content goes here...</p>
    </article>
  </main>
  
  <footer>
    <!-- Footer content -->
  </footer>
</body>
</html>

<!-- ✅ GOOD: ARIA kept in sync -->
<button 
  aria-expanded={isExpanded}
  aria-controls="content-panel"
  onClick={toggle}
>
  {isExpanded ? 'Collapse' : 'Expand'}
</button>
<div 
  id="content-panel" 
  hidden={!isExpanded}
>
  {content}
</div>

<!-- ✅ GOOD: Status messages announced -->
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading ? 'Loading...' : 'Content loaded successfully'}
</div>

<!-- ✅ GOOD: Custom controls with proper roles -->
<div 
  role="slider"
  aria-label="Volume"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow={volume}
  tabindex="0"
/>
```
</wcag_principles>

<react_a11y_example>
**React Accessibility Components:**

```tsx
// Accessible Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`btn btn-${variant}`}
    >
      {isLoading && (
        <span className="spinner" aria-hidden="true" />
      )}
      <span>{children}</span>
    </button>
  );
};

// Accessible Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus first focusable element in modal
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore previous focus
      previousFocusRef.current?.focus();
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="modal-close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </header>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

// Accessible Form Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  id,
  required,
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="form-group">
      <label htmlFor={inputId}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        <input
          id={inputId}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={[
            hint ? hintId : null,
            error ? errorId : null
          ].filter(Boolean).join(' ') || undefined}
          {...props}
        />
      </label>
      
      {hint && (
        <span id={hintId} className="form-hint">
          {hint}
        </span>
      )}
      
      {error && (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

// Accessible Navigation Component
export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  return (
    <nav aria-label="Main navigation" ref={navRef}>
      {/* Mobile menu toggle */}
      <button
        aria-expanded={isOpen}
        aria-controls="main-menu"
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-menu-toggle"
      >
        <span className="sr-only">Toggle menu</span>
        <span aria-hidden="true">{isOpen ? '✕' : '☰'}</span>
      </button>

      <ul 
        id="main-menu" 
        hidden={!isOpen}
        className="nav-list"
      >
        <li>
          <a href="/" aria-current="page">Home</a>
        </li>
        <li>
          <a href="/products">Products</a>
        </li>
        <li>
          <a href="/about">About</a>
        </li>
        <li>
          <a href="/contact">Contact</a>
        </li>
      </ul>
    </nav>
  );
};

// Screen reader only utility class
// .sr-only {
//   position: absolute;
//   width: 1px;
//   height: 1px;
//   padding: 0;
//   margin: -1px;
//   overflow: hidden;
//   clip: rect(0, 0, 0, 0);
//   white-space: nowrap;
//   border: 0;
// }
```
</react_a11y_example>

<testing_example>
**Accessibility Testing:**

```typescript
// Automated testing with jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <Button onClick={() => {}}>Click me</Button>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be accessible when disabled', async () => {
    const { container } = render(
      <Button disabled>Disabled</Button>
    );
    
    const button = container.querySelector('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// Testing keyboard navigation
import { fireEvent, render, screen } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('should trap focus within modal', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <button>First Button</button>
        <button>Last Button</button>
      </Modal>
    );

    const firstButton = screen.getByText('First Button');
    const lastButton = screen.getByText('Last Button');

    // Focus should be on first button initially
    expect(firstButton).toHaveFocus();

    // Tab to last button
    fireEvent.keyDown(firstButton, { key: 'Tab' });
    expect(lastButton).toHaveFocus();

    // Tab should cycle back to first
    fireEvent.keyDown(lastButton, { key: 'Tab' });
    expect(firstButton).toHaveFocus();
  });

  it('should close on Escape key', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        Content
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

// CI/CD integration with axe-core
// .github/workflows/accessibility.yml
// name: Accessibility Testing
// on: [push, pull_request]
// jobs:
//   axe:
//     runs-on: ubuntu-latest
//     steps:
//       - uses: actions/checkout@v3
//       - uses: actions/setup-node@v3
//         with:
//           node-version: '18'
//       - run: npm ci
//       - run: npm run test:a11y
//       - name: Run Lighthouse
//         run: npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse.json --quiet
//       - name: Check accessibility score
//         run: node scripts/check-a11y-score.js
```
</testing_example>
