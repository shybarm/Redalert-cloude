export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">אודות שמאי AI</h1>
      <p className="text-muted-foreground">
        שמאי AI הוא כלי חכם להערכת שווי של פריטים יד שנייה ויצירת מודעות מכירה
        אוטומטיות. הכלי משתמש בבינה מלאכותית מתקדמת כדי לזהות פריטים מתמונות,
        להעריך את שוויים בשוק הישראלי, ולכתוב מודעות מכירה מקצועיות בעברית.
      </p>

      <h2 className="text-xl font-semibold">איך זה עובד</h2>
      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
        <li>מצלמים שתי תמונות של הפריט - חזית ופרט מזהה</li>
        <li>הבינה המלאכותית מזהה את המותג, הדגם והמצב</li>
        <li>מערכת המחירים משווה למחירי שוק עדכניים</li>
        <li>מודעה מוכנה נוצרת עם כותרת, תיאור ומילות חיפוש</li>
        <li>מפרסמים בלחיצה אחת</li>
      </ol>

      <h2 className="text-xl font-semibold" id="terms">תנאי שימוש</h2>
      <p className="text-muted-foreground">
        הערכות השווי הן הערכות בלבד ואינן מהוות הצעת מחיר מחייבת. המחיר הסופי
        נקבע בין המוכר לקונה. שמאי AI אינו אחראי לעסקאות המתבצעות בין
        משתמשים.
      </p>

      <h2 className="text-xl font-semibold" id="privacy">פרטיות</h2>
      <p className="text-muted-foreground">
        תמונות שמועלות למערכת משמשות לצורך זיהוי הפריט והערכת שווי בלבד. אנו
        לא משתפים את התמונות עם צדדים שלישיים מעבר לספקי שירותי הבינה
        המלאכותית הנדרשים לתפקוד המערכת.
      </p>
    </div>
  );
}
