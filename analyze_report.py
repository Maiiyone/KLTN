import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Configuration
INPUT_FILE = "d:/WEB/KLTN/evaluation_data/evaluation_report.csv"
OUTPUT_DIR = "d:/WEB/KLTN/evaluation_data/charts"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def analyze_and_plot():
    # 1. Load Data
    print(f"Loading data from {INPUT_FILE}...")
    df = pd.read_csv(INPUT_FILE)
    
    # 2. Print first 5 rows
    print("\n" + "="*50)
    print("TOP 5 ROWS preview:")
    print("="*50)
    print(df.head(5).to_markdown(index=False))

    # 3. Calculate Metrics
    # Count TP, TN, FP, FN
    counts = df['Classification'].value_counts()
    tp = counts.get('TP', 0)
    tn = counts.get('TN', 0)
    fp = counts.get('FP', 0)
    fn = counts.get('FN', 0)
    total = len(df)
    
    # Metrics Formulas
    # Correctness = (TP + TN) / Total
    accuracy = (tp + tn) / total if total > 0 else 0
    
    # Retrieval Precision (Khả năng trả lời đúng khi quyết định trả lời)
    # Precision = TP / (TP + FP)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    
    # Retrieval Recall (Khả năng tìm được câu trả lời trong tổng số câu cần trả lời)
    # Recall = TP / (TP + FN)
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    
    # F1 Score
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    # Hallucination Rate (Tỉ lệ bịa đặt)
    hallucination_rate = fp / total if total > 0 else 0

    print("\n" + "="*50)
    print("📊 EVALUATION METRICS")
    print("="*50)
    print(f"Total Items: {total}")
    print(f"TP (True Positive):  {tp}")
    print(f"TN (True Negative):  {tn}")
    print(f"FP (False Positive): {fp} (Hallucination/Wrong)")
    print(f"FN (False Negative): {fn} (Missed)")
    print("-" * 30)
    print(f"✅ Accuracy:  {accuracy:.2%}")
    print(f"🎯 Precision: {precision:.2%}")
    print(f"🔍 Recall:    {recall:.2%}")
    print(f"⚖️ F1 Score:  {f1:.2%}")
    print(f"🚫 Hallucination Rate: {hallucination_rate:.2%}")

    # Set style
    sns.set_theme(style="whitegrid")
    
    # Chart 1: Confusion Matrix Status Distribution
    plt.figure(figsize=(10, 6))
    ax = sns.countplot(data=df, x='Classification', order=['TP', 'TN', 'FP', 'FN'], palette='viridis')
    plt.title('Distribution of Classification Results (TP/TN/FP/FN)', fontsize=16)
    plt.xlabel('Classification', fontsize=12)
    plt.ylabel('Count', fontsize=12)
    # Add labels
    for container in ax.containers:
        ax.bar_label(container)
    plt.savefig(f"{OUTPUT_DIR}/classification_dist.png")
    plt.close()
    
    # Chart 2: Self Assessment Detailed Distribution
    plt.figure(figsize=(12, 6))
    assessment_order = [
        "Correct Answer", 
        "Correct Refusal", 
        "Partially Correct", 
        "Missed / Fallback", 
        "Hallucination / Unsupported"
    ]
    ax = sns.countplot(y='Self Assessment', data=df, order=assessment_order, palette='muted')
    plt.title('Qdrant + RAG Quality Detailed Breakdown', fontsize=16)
    plt.xlabel('Count', fontsize=12)
    plt.ylabel('Assessment Category', fontsize=12)
    for container in ax.containers:
        ax.bar_label(container)
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/detailed_assessment.png")
    plt.close()

    # Chart 3: Pie Chart of Success vs Failure
    plt.figure(figsize=(8, 8))
    success = tp + tn
    failure = fp + fn
    plt.pie([success, failure], labels=[f'Success ({success})', f'Failure ({failure})'], 
            autopct='%1.1f%%', colors=['#66b3ff', '#ff9999'], startangle=90, explode=(0.05, 0))
    plt.title('Overall System Success Rate', fontsize=16)
    plt.savefig(f"{OUTPUT_DIR}/success_rate_pie.png")
    plt.close()

    print("\n" + "="*50)
    print(f"📉 Charts saved to: {OUTPUT_DIR}")
    print("- classification_dist.png")
    print("- detailed_assessment.png")
    print("- success_rate_pie.png")
    print("="*50)

if __name__ == "__main__":
    analyze_and_plot()
