import { Router, RouteLocationNormalized } from 'vue-router';

const STACK_KEY = 'smart_history_stack';

// Helper to get stack from storage
function getStack(): string[] {
    try {
        return JSON.parse(sessionStorage.getItem(STACK_KEY) || '[]');
    } catch {
        return [];
    }
}

// Helper to save stack
function setStack(stack: string[]) {
    try {
        sessionStorage.setItem(STACK_KEY, JSON.stringify(stack));
    } catch { }
}

// Initialize/Update stack on navigation
export function trackNavigation(to: RouteLocationNormalized, from: RouteLocationNormalized) {
    const stack = getStack();
    const toPath = to.fullPath;
    const fromPath = from.fullPath;

    // If we are going back (detected via browser state or heuristic), we should pop
    // But Vue Router doesn't give us direction easily in global guards.
    // We'll rely on our smartPush to manage the stack explicitly where possible,
    // and here we just try to keep sync.

    // Actually, purely tracking "push" vs "back" globally is hard without listening to popstate.
    // Let's just append if it's new.

    // Simple logic: If 'to' is the last item, do nothing (refresh).
    // If 'to' is the 2nd to last item, we probably went back. Pop the last.

    if (stack.length > 0 && stack[stack.length - 1] === toPath) {
        // Refresh or same page
        return;
    }

    if (stack.length > 1 && stack[stack.length - 2] === toPath) {
        // We went back!
        stack.pop();
        setStack(stack);
        return;
    }

    // Otherwise, assume push
    stack.push(toPath);
    // Limit stack size to prevent storage issues
    if (stack.length > 50) stack.shift();
    setStack(stack);
}

// The Core Function: Smart Push
export function smartPush(router: Router, target: string | any) {
    const stack = getStack();
    const current = router.currentRoute.value.fullPath;

    // Resolve target path
    const resolved = router.resolve(target);
    const targetPath = resolved.fullPath;

    // 1. Prevent Duplicate (Same Page)
    if (current === targetPath) {
        return; // Do nothing
    }

    // 2. Smart Back (Unwind)
    // If target is the *previous* page in our stack, go back instead of push
    if (stack.length > 1 && stack[stack.length - 2] === targetPath) {
        router.back();
        return;
    }

    // 3. Standard Push
    router.push(target);
}

// Smart Back for specific scenarios (like Orders page)
// Tries to go back, but if history is empty or previous page is "unsafe" (like auth/checkout), goes to fallback
export function smartBack(router: Router, fallback: string = '/') {
    const stack = getStack();

    if (stack.length > 1) {
        // Check if previous page is safe?
        // For now, just go back
        router.back();
    } else {
        // No history, use fallback
        router.push(fallback);
    }
}
