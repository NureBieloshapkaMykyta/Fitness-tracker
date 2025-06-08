using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FitnessTracker.Models
{
    public class AddMealViewModel
    {
        [Required]
        public DateTime Date { get; set; }
        public List<ProductViewModel> Products { get; set; } = new();
    }

    public class ProductViewModel
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public float WeightInGr { get; set; }
        public float Calories { get; set; }
        public float Proteins { get; set; }
        public float Fats { get; set; }
        public float Carbohydrates { get; set; }
        public string Description { get; set; }
    }
} 