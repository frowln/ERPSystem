import { describe, it, expect } from 'vitest';
import { navigation } from './navigation';
import type { NavGroup, NavItem } from './navigation';

describe('navigation config', () => {
  it('exports navigation array', () => {
    expect(Array.isArray(navigation)).toBe(true);
    expect(navigation.length).toBeGreaterThan(0);
  });

  it('each group has required fields', () => {
    for (const group of navigation) {
      expect(group.id).toBeTruthy();
      expect(typeof group.title).toBe('string');
      expect(group.icon).toBeTruthy();
      expect(Array.isArray(group.items)).toBe(true);
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it('each item has required fields', () => {
    const allItems: NavItem[] = navigation.flatMap((g) => g.items);
    for (const item of allItems) {
      expect(item.id).toBeTruthy();
      expect(typeof item.label).toBe('string');
      expect(item.icon).toBeTruthy();
      expect(item.href).toBeTruthy();
      expect(item.href.startsWith('/')).toBe(true);
    }
  });

  it('all item ids are unique', () => {
    const allIds = navigation.flatMap((g) => g.items.map((i) => i.id));
    const unique = new Set(allIds);
    // If this fails, a nav item id was duplicated — check for duplicate entries
    expect(unique.size).toBe(allIds.length);
  });

  it('all group ids are unique', () => {
    const groupIds = navigation.map((g) => g.id);
    const unique = new Set(groupIds);
    expect(unique.size).toBe(groupIds.length);
  });

  it('contains essential groups', () => {
    const groupIds = navigation.map((g) => g.id);
    expect(groupIds).toContain('home');
    expect(groupIds).toContain('projects');
    expect(groupIds).toContain('tasks');
    expect(groupIds).toContain('finance');
  });

  it('dashboard links to /', () => {
    const homeGroup = navigation.find((g) => g.id === 'home');
    expect(homeGroup).toBeDefined();
    const dashboard = homeGroup!.items.find((i) => i.id === 'dashboard');
    expect(dashboard).toBeDefined();
    expect(dashboard!.href).toBe('/');
  });

  it('projects link to /projects', () => {
    const projectsGroup = navigation.find((g) => g.id === 'projects');
    expect(projectsGroup).toBeDefined();
    const projectsList = projectsGroup!.items.find((i) => i.id === 'projects-list');
    expect(projectsList).toBeDefined();
    expect(projectsList!.href).toBe('/projects');
  });

  it('no duplicate hrefs within a group', () => {
    for (const group of navigation) {
      const hrefs = group.items.map((i) => i.href);
      const unique = new Set(hrefs);
      expect(unique.size).toBe(hrefs.length);
    }
  });

  it('total item count is reasonable (>20 items)', () => {
    const totalItems = navigation.reduce((sum, g) => sum + g.items.length, 0);
    expect(totalItems).toBeGreaterThan(20);
  });
});
