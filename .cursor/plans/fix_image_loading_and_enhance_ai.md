# Fix Image Loading, Layout, and Enhance AI Analysis

## Issues to Address

1. **Image loading issues** - Images at top load but not further down (caching/loading)
2. **Layout change** - Desktop screenshot first (full width), then mobile below (full width)
3. **Image overflow** - Images overrunning content
4. **Page break control** - Written content shouldn't show until after images end
5. **AI analysis depth** - Enhance OpenAI prompt to pick up more issues

## Solutions

### 1. Fix Image Loading Issues

**File:** `api/_lib/pdf.js`

**Implementation:**
- After converting to Blob URLs, scroll to each image to ensure it's in viewport
- Use `page.evaluate()` to scroll each image into view and wait for render
- Add explicit verification that each image has `naturalWidth > 0` and `naturalHeight > 0`
- Force layout recalculation by scrolling the entire page
- Add retry logic if images aren't ready

**Code approach:**
```javascript
// After Blob URL conversion, scroll to each image
await page.evaluate(() => {
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    img.scrollIntoView({ behavior: 'instant', block: 'center' });
    // Force a reflow
    void img.offsetHeight;
  });
});
// Wait for all images to be fully rendered
await page.waitForTimeout(1000);
// Verify all images are loaded
const allLoaded = await page.evaluate(() => {
  return Array.from(document.images).every(img => 
    img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
  );
});
```

### 2. Change Layout: Desktop First, Then Mobile (Full Width)

**File:** `api/_lib/reportHtml.js`

**Implementation:**
- Remove `.grid2` grid layout from Screenshots section
- Stack screenshots vertically: desktop full width first, then mobile full width below
- Each screenshot container should be 100% width
- Add clear spacing between desktop and mobile screenshots

**HTML change:**
```html
<div class="section">
  <h2>Screenshots</h2>
  <div class="shot-full">
    <div class="label">Desktop</div>
    <img src="..." alt="Desktop screenshot" />
  </div>
  <div class="shot-full" style="margin-top: 20px;">
    <div class="label">Mobile</div>
    <img src="..." alt="Mobile screenshot" />
  </div>
</div>
```

**CSS addition:**
```css
.shot-full {
  width: 100%;
  border: 1px solid rgba(0,0,0,0.10);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  page-break-inside: avoid;
  margin-bottom: 20px;
}
```

### 3. Fix Image Overflow

**File:** `api/_lib/reportHtml.js`

**Implementation:**
- Add strict image constraints: `max-width: 100%`, `height: auto`
- Set `max-height` to prevent extremely tall images (e.g., `max-height: 800px`)
- Use `object-fit: contain` to maintain aspect ratio
- Ensure images respect container boundaries
- Add `overflow: hidden` to `.shot-full` container

**CSS:**
```css
.shot-full img {
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: 800px;
  display: block;
  object-fit: contain;
  page-break-inside: avoid;
}
```

### 4. Page Break Control: Content After Images

**File:** `api/_lib/reportHtml.js`

**Implementation:**
- Add `page-break-after: always` to Screenshots section to force next content to new page
- Or use `page-break-after: avoid` on Screenshots section and `page-break-before: always` on Friction Points section
- Ensure screenshots section doesn't split across pages
- Force Friction Points to start on new page after screenshots

**CSS:**
```css
.screenshots-section {
  page-break-after: always;
  page-break-inside: avoid;
}
```

### 5. Enhance OpenAI Prompt for Deeper Analysis

**File:** `api/_lib/teardown.js`

**Implementation:**
- Increase requested friction points from 5-8 to 8-12
- Add specific analysis categories to examine:
  - Hero section effectiveness
  - Product presentation
  - Checkout flow visibility
  - Social proof placement
  - Navigation clarity
  - Form design
  - Loading states
  - Error handling
- Request conversion impact estimates where possible
- Ask for specific metrics or benchmarks
- Request more detailed evidence with screenshot references
- Emphasize finding both obvious and subtle issues

**Enhanced prompt additions:**
```
- Analyze these specific areas in detail:
  * Hero section: CTA visibility, value proposition clarity, trust signals
  * Product presentation: Image quality, pricing clarity, availability indicators
  * Navigation: Menu structure, search functionality, category organization
  * Forms: Field labels, validation, error messages, completion flow
  * Checkout: Progress indicators, security badges, shipping options
  * Mobile-specific: Touch targets, thumb-friendly zones, responsive behavior
  * Trust elements: Reviews, ratings, guarantees, security badges, testimonials
  * Performance indicators: Loading states, skeleton screens, error handling

- Output 8-12 high-impact friction points (not just 5-8)
- For each issue, estimate potential conversion impact (e.g., "This could reduce conversions by 5-10%")
- Reference specific visual elements from screenshots (e.g., "The hero CTA button at coordinates...")
- Identify both obvious issues and subtle UX problems
- Look for missed opportunities, not just problems
```

## Implementation Order

1. Fix image loading (scroll and verify)
2. Change layout to vertical stack
3. Fix image overflow constraints
4. Add page break controls
5. Enhance AI prompt

## Testing

- Generate test PDF and verify all images appear
- Check that desktop appears first, then mobile
- Verify images don't overflow content
- Confirm Friction Points starts on new page after screenshots
- Review AI output for increased depth and more issues identified





