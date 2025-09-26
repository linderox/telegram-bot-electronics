// src/types.ts
export interface AssistentGPTModel {
    id: string;
    title: string;
    created_at: string;
}
  
export interface TrainingData {
  question: string;
  answer: string;
}