using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;

namespace FitnessTracker.Models
{
    public class AddTrainingViewModel
    {
        [Required]
        public DateTime Date { get; set; }
        [Required]
        public string Description { get; set; }
        public List<ExerciseViewModel> Exercises { get; set; } = new();
    }

    public class ExerciseViewModel
    {
        [Required]
        public string Name { get; set; }
        public TimeSpan Duration { get; set; }
        public string Description { get; set; }
    }
} 