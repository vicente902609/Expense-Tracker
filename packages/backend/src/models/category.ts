// DynamoDB item shape — shared by predefined (PK=CATEGORY#PREDEFINED) and custom (PK=USER#<userId>)
export interface CategoryItem {
  PK: string;
  SK: string;       // CAT#<categoryId>
  categoryId: string;
  name: string;
  color: string;
  createdAt: string;
}

// API response shapes
export interface PredefinedCategory {
  categoryId: string;
  name: string;
  color: string;
}

export interface CustomCategory {
  categoryId: string;
  name: string;
  color: string;
  createdAt: string;
}

export const PREDEFINED_PK = 'CATEGORY#PREDEFINED';
