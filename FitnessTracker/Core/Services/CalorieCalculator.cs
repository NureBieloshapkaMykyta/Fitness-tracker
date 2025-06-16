

namespace FitnessTracker.Core.Services
{
    public class CalorieCalculator
    {
        public class ExerciseInfo
        {
            public string Name { get; set; }
            public double MET { get; set; }
            public string Category { get; set; }
        }

        // Base MET (Metabolic Equivalent of Task) values for different exercise types
        private static readonly Dictionary<string, (double MET, string Category)> ExerciseMETs = new()
        {
            // Cardio exercises
            { "Running", (9.8, "Cardio") },
            { "Jogging", (7.0, "Cardio") },
            { "Walking", (3.5, "Cardio") },
            { "Cycling", (7.5, "Cardio") },
            { "Swimming", (8.3, "Cardio") },
            { "Jumping Rope", (11.8, "Cardio") },
            
            // Strength training
            { "Weight Lifting", (5.0, "Strength") },
            { "Push-ups", (8.0, "Strength") },
            { "Pull-ups", (8.0, "Strength") },
            { "Squats", (5.0, "Strength") },
            { "Plank", (3.5, "Strength") },
            
            // Other activities
            { "Yoga", (3.0, "Flexibility") },
            { "Stretching", (2.5, "Flexibility") },
            { "Dancing", (6.0, "Cardio") },
            { "Basketball", (8.0, "Sports") },
            { "Tennis", (7.0, "Sports") }
        };

        // Default MET value for unknown exercises
        private const double DefaultMET = 5.0;

        public static IEnumerable<ExerciseInfo> GetAvailableExercises()
        {
            return ExerciseMETs.Select(e => new ExerciseInfo
            {
                Name = e.Key,
                MET = e.Value.MET,
                Category = e.Value.Category
            });
        }

        public static int CalculateCaloriesBurned(string exerciseName, TimeSpan duration, double weight = 70.0)
        {
            // Get MET value for the exercise
            double met = GetMETValue(exerciseName);

            // Calculate calories using the formula:
            // Calories = MET * Weight (kg) * Duration (hours)
            double calories = met * weight * duration.TotalHours;

            return (int)Math.Round(calories);
        }

        private static double GetMETValue(string exerciseName)
        {
            // Try to find exact match
            if (ExerciseMETs.TryGetValue(exerciseName, out var exerciseInfo))
            {
                return exerciseInfo.MET;
            }

            // Try to find partial match
            var matchingExercise = ExerciseMETs.Keys
                .FirstOrDefault(k => exerciseName.Contains(k, StringComparison.OrdinalIgnoreCase));
            
            return matchingExercise != null ? ExerciseMETs[matchingExercise].MET : DefaultMET;
        }
    }
} 