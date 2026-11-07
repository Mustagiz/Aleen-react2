import React from 'react';
import ReactDOMServer from 'react-dom/server';
import * as Icons from './index';

describe('Platform Icon Set - Iconsax Linear', () => {
  test('icon set identifier is iconsax-linear', () => {
    // Law 1: Must fail first against current Tabler set
    expect(Icons.ICON_SET_NAME).toBe('iconsax-linear');
  });

  test('all required platform icons are exported as valid React components', () => {
    const requiredIcons = [
      'Dashboard', 'Receipt', 'People', 'Inventory', 'ContentCut',
      'AccountBalance', 'Settings', 'Search', 'Add', 'Close',
      'Check', 'Delete', 'Edit', 'Print', 'Notifications',
      'TrendingUp', 'Diamond', 'AutoAwesome', 'WhatsApp', 'CloudUpload'
    ];

    requiredIcons.forEach(name => {
      const IconComp = Icons[name];
      expect(IconComp).toBeDefined();
      expect(typeof IconComp).toBe('function');
    });
  });

  test('renders with Iconsax Linear stroke attributes and MUI compatibility', () => {
    const html = ReactDOMServer.renderToStaticMarkup(<Icons.Dashboard />);
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('stroke-width:1.5');
  });
});
