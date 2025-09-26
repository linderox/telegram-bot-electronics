// Define the export interface for the child button
export interface ChildButton {
    id: number;
    title: string;
    type: string; // e.g., "reply"
    row: number;
    column: number;
    is_active: boolean;
    request_contact: boolean;
    updated_at: string; // ISO date string
    created_at: string; // ISO date string
}

// Define the export interface for the transition button
export interface TransitionButton {
    id: number;
    title: string;
    type: string; // e.g., "reply"
    row: number;
    column: number;
    is_active: boolean;
    request_contact: boolean;
    updated_at: string; // ISO date string
    created_at: string; // ISO date string
}

// Define the main export interface for the menu item
export interface MenuItem {
    id: number;
    menu_key: string;
    text: string;
    media: any; // Adjust the type based on your media structure
    is_active: boolean;
    is_protected: boolean;
    updated_at: string; // ISO date string
    created_at: string; // ISO date string
    children_buttons: ChildButton[]; // Array of child buttons
    transition_button: TransitionButton | null; // Transition button or null
}

// Define the export interface for the entire menu response
export interface MenuResponse {
    menus: MenuItem[]; // Array of menu items
}