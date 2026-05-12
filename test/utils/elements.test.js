import { describe, it, expect, beforeEach } from 'vitest';
import {
  wrap,
  setAttributes,
  createElement,
  insertAfter,
  insertElement,
  removeElement,
  emptyElement,
  replaceElement,
  getAttributesFromSelector,
  toggleHidden,
  toggleClass,
  hasClass,
  matches,
  closest,
  setFocus,
} from '../../src/js/utils/elements';

describe('elements utils', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('createElement', () => {
    it('creates a basic element', () => {
      const el = createElement('div');
      expect(el.tagName.toLowerCase()).toBe('div');
    });

    it('creates element with attributes', () => {
      const el = createElement('div', { id: 'test', class: 'foo' });
      expect(el.id).toBe('test');
      expect(el.className).toBe('foo');
    });

    it('creates element with text content', () => {
      const el = createElement('span', {}, 'Hello');
      expect(el.textContent).toBe('Hello');
    });

    it('creates element with attributes and text', () => {
      const el = createElement('a', { href: '/test' }, 'Click me');
      expect(el.href.endsWith('/test')).toBe(true);
      expect(el.textContent).toBe('Click me');
    });

    it('ignores null/undefined attributes', () => {
      const el = createElement('div', { id: 'test', 'data-foo': null, 'data-bar': undefined });
      expect(el.id).toBe('test');
      expect(el.hasAttribute('data-foo')).toBe(false);
      expect(el.hasAttribute('data-bar')).toBe(false);
    });
  });

  describe('setAttributes', () => {
    it('sets multiple attributes', () => {
      const el = document.createElement('div');
      setAttributes(el, { id: 'myId', 'data-test': 'value' });
      expect(el.id).toBe('myId');
      expect(el.getAttribute('data-test')).toBe('value');
    });

    it('does nothing for non-element', () => {
      expect(() => setAttributes(null, {})).not.toThrow();
      expect(() => setAttributes('string', {})).not.toThrow();
    });

    it('does nothing for empty attributes', () => {
      const el = document.createElement('div');
      setAttributes(el, {});
      setAttributes(el, null);
      setAttributes(el, undefined);
      expect(el.attributes.length).toBe(0);
    });

    it('skips null and undefined values', () => {
      const el = document.createElement('div');
      setAttributes(el, { id: 'test', foo: null, bar: undefined });
      expect(el.id).toBe('test');
      expect(el.hasAttribute('foo')).toBe(false);
      expect(el.hasAttribute('bar')).toBe(false);
    });
  });

  describe('wrap', () => {
    it('wraps a single element', () => {
      const child = document.createElement('span');
      container.appendChild(child);
      const wrapper = document.createElement('div');
      wrap(child, wrapper);
      expect(wrapper.contains(child)).toBe(true);
      expect(container.contains(wrapper)).toBe(true);
    });

    it('wraps multiple elements', () => {
      const child1 = document.createElement('span');
      const child2 = document.createElement('span');
      container.appendChild(child1);
      container.appendChild(child2);
      const wrapper = document.createElement('div');
      wrap([child1, child2], wrapper);
      // The last element gets the original wrapper, others get clones
      expect(wrapper.contains(child2)).toBe(true);
      expect(container.contains(wrapper)).toBe(true);
    });

    it('maintains sibling order', () => {
      const child1 = document.createElement('span');
      const child2 = document.createElement('span');
      container.appendChild(child1);
      container.appendChild(child2);
      const wrapper = document.createElement('div');
      wrap(child1, wrapper);
      expect(container.children[0]).toBe(wrapper);
      expect(container.children[1]).toBe(child2);
    });
  });

  describe('insertAfter', () => {
    it('inserts element after target', () => {
      const el1 = document.createElement('span');
      const el2 = document.createElement('span');
      container.appendChild(el1);
      insertAfter(el2, el1);
      expect(container.children[0]).toBe(el1);
      expect(container.children[1]).toBe(el2);
    });

    it('does nothing for invalid elements', () => {
      expect(() => insertAfter(null, null)).not.toThrow();
      expect(() => insertAfter('a', 'b')).not.toThrow();
    });
  });

  describe('insertElement', () => {
    it('creates and appends element to parent', () => {
      insertElement('span', container, { id: 'test' }, 'Hello');
      const el = container.querySelector('#test');
      expect(el).not.toBeNull();
      expect(el.textContent).toBe('Hello');
    });

    it('does nothing for non-element parent', () => {
      expect(() => insertElement('div', null, {}, 'text')).not.toThrow();
    });
  });

  describe('removeElement', () => {
    it('removes a single element', () => {
      const el = document.createElement('span');
      container.appendChild(el);
      removeElement(el);
      expect(container.contains(el)).toBe(false);
    });

    it('removes multiple elements from array', () => {
      const el1 = document.createElement('span');
      const el2 = document.createElement('span');
      container.appendChild(el1);
      container.appendChild(el2);
      removeElement([el1, el2]);
      expect(container.children.length).toBe(0);
    });

    it('does nothing for invalid element', () => {
      expect(() => removeElement(null)).not.toThrow();
      expect(() => removeElement('string')).not.toThrow();
    });

    it('does nothing if element has no parent', () => {
      const el = document.createElement('span');
      expect(() => removeElement(el)).not.toThrow();
    });
  });

  describe('emptyElement', () => {
    it('removes all child elements', () => {
      const parent = document.createElement('div');
      parent.appendChild(document.createElement('span'));
      parent.appendChild(document.createElement('span'));
      emptyElement(parent);
      expect(parent.childNodes.length).toBe(0);
    });

    it('does nothing for non-element', () => {
      expect(() => emptyElement(null)).not.toThrow();
    });
  });

  describe('replaceElement', () => {
    it('replaces old element with new', () => {
      const oldEl = document.createElement('span');
      container.appendChild(oldEl);
      const newEl = document.createElement('div');
      replaceElement(newEl, oldEl);
      expect(container.contains(newEl)).toBe(true);
      expect(container.contains(oldEl)).toBe(false);
    });

    it('returns null for invalid inputs', () => {
      expect(replaceElement(null, null)).toBeNull();
      expect(replaceElement(document.createElement('div'), null)).toBeNull();
    });
  });

  describe('getAttributesFromSelector', () => {
    it('converts class selector', () => {
      expect(getAttributesFromSelector('.test')).toEqual({ class: 'test' });
    });

    it('converts id selector', () => {
      expect(getAttributesFromSelector('#myId')).toEqual({ id: 'myId' });
    });

    it('converts attribute selector', () => {
      expect(getAttributesFromSelector('[data-foo="bar"]')).toEqual({ 'data-foo': 'bar' });
    });

    it('merges with existing attributes', () => {
      expect(getAttributesFromSelector('.new', { class: 'old' })).toEqual({ class: 'old new' });
    });

    it('returns empty for non-string', () => {
      expect(getAttributesFromSelector('')).toEqual({});
      expect(getAttributesFromSelector(null)).toEqual({});
      expect(getAttributesFromSelector(undefined)).toEqual({});
    });

    it('handles multiple selectors', () => {
      const result = getAttributesFromSelector('.foo, #bar');
      expect(result.class).toBe('foo');
      expect(result.id).toBe('bar');
    });
  });

  describe('toggleHidden', () => {
    it('toggles hidden state', () => {
      const el = document.createElement('div');
      expect(el.hidden).toBe(false);
      toggleHidden(el);
      expect(el.hidden).toBe(true);
      toggleHidden(el);
      expect(el.hidden).toBe(false);
    });

    it('sets specific hidden state', () => {
      const el = document.createElement('div');
      toggleHidden(el, true);
      expect(el.hidden).toBe(true);
      toggleHidden(el, false);
      expect(el.hidden).toBe(false);
    });

    it('does nothing for non-element', () => {
      expect(() => toggleHidden(null)).not.toThrow();
    });
  });

  describe('toggleClass', () => {
    it('toggles class on element', () => {
      const el = document.createElement('div');
      expect(toggleClass(el, 'foo')).toBe(true);
      expect(el.classList.contains('foo')).toBe(true);
      expect(toggleClass(el, 'foo')).toBe(false);
      expect(el.classList.contains('foo')).toBe(false);
    });

    it('forces add with true', () => {
      const el = document.createElement('div');
      expect(toggleClass(el, 'foo', true)).toBe(true);
      expect(toggleClass(el, 'foo', true)).toBe(true);
    });

    it('forces remove with false', () => {
      const el = document.createElement('div');
      el.classList.add('foo');
      expect(toggleClass(el, 'foo', false)).toBe(false);
    });

    it('handles nodeList', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      container.appendChild(el1);
      container.appendChild(el2);
      const nodeList = container.querySelectorAll('div');
      const results = toggleClass(nodeList, 'foo');
      expect(results).toEqual([true, true]);
    });

    it('returns false for non-element', () => {
      expect(toggleClass(null, 'foo')).toBe(false);
    });
  });

  describe('hasClass', () => {
    it('returns true when class exists', () => {
      const el = document.createElement('div');
      el.classList.add('foo');
      expect(hasClass(el, 'foo')).toBe(true);
    });

    it('returns false when class does not exist', () => {
      const el = document.createElement('div');
      expect(hasClass(el, 'foo')).toBe(false);
    });

    it('returns false for non-element', () => {
      expect(hasClass(null, 'foo')).toBe(false);
    });
  });

  describe('matches', () => {
    it('matches element by selector', () => {
      const el = document.createElement('div');
      el.className = 'foo';
      container.appendChild(el);
      expect(matches(el, '.foo')).toBe(true);
      expect(matches(el, 'div')).toBe(true);
      expect(matches(el, '.bar')).toBe(false);
    });
  });

  describe('closest', () => {
    it('finds closest ancestor matching selector', () => {
      const outer = document.createElement('div');
      outer.className = 'outer';
      const inner = document.createElement('div');
      outer.appendChild(inner);
      container.appendChild(outer);
      expect(closest(inner, '.outer')).toBe(outer);
    });

    it('returns element itself if it matches', () => {
      const el = document.createElement('div');
      el.className = 'test';
      container.appendChild(el);
      expect(closest(el, '.test')).toBe(el);
    });

    it('returns null if no match', () => {
      const el = document.createElement('div');
      container.appendChild(el);
      expect(closest(el, '.nonexistent')).toBeNull();
    });
  });

  describe('setFocus', () => {
    it('focuses element', () => {
      const el = document.createElement('input');
      container.appendChild(el);
      setFocus(el);
      expect(document.activeElement).toBe(el);
    });

    it('does nothing for non-element', () => {
      expect(() => setFocus(null)).not.toThrow();
    });
  });
});
