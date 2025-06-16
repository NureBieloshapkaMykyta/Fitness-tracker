using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Persistence;
using Core.Entities;

namespace FitnessTracker.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly UserManager<AppUser> _userManager;
        private readonly AppDbContext _context;

        public HomeController(ILogger<HomeController> logger, UserManager<AppUser> userManager, AppDbContext context)
        {
            _logger = logger;
            _userManager = userManager;
            _context = context;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetStatistics(DateTime date, string period)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var startDate = date.Date;
            var endDate = period switch
            {
                "week" => GetWeekEndDate(startDate),
                "month" => GetMonthEndDate(startDate),
                _ => startDate.AddDays(1)
            };

            startDate = period switch
            {
                "week" => GetWeekStartDate(startDate),
                "month" => GetMonthStartDate(startDate),
                _ => startDate
            };

            _logger.LogInformation($"Statistics period: {period}, Start date: {startDate}, End date: {endDate}");

            // Get training statistics
            var trainings = await _context.Training
                .Include(t => t.Exercises)
                .Where(t => t.UserId == user.Id && t.Date >= startDate && t.Date < endDate)
                .ToListAsync();

            _logger.LogInformation($"Found {trainings.Count} trainings for period");

            var trainingStats = new
            {
                totalTrainings = trainings.Count,
                totalExercises = trainings.Sum(t => t.Exercises?.Count ?? 0),
                totalCaloriesBurned = trainings.Sum(t => t.Exercises?.Sum(e => e.CaloriesBurned ?? 0) ?? 0),
                calorieGoal = period switch
                {
                    "week" => 3500,
                    "month" => 15000,
                    _ => 500
                }
            };

            // Get nutrition statistics
            var meals = await _context.Meals
                .Include(m => m.Products)
                .Where(m => m.UserId == user.Id && m.Date >= startDate && m.Date < endDate)
                .ToListAsync();

            _logger.LogInformation($"Found {meals.Count} meals for period");

            var allProducts = meals.SelectMany(m => m.Products ?? new List<Product>()).ToList();
            var nutritionStats = new
            {
                totalMeals = meals.Count,
                totalCalories = allProducts.Sum(p => p.Calories),
                avgProteins = allProducts.Any() ? allProducts.Average(p => p.Proteins) : 0,
                calorieGoal = period switch
                {
                    "week" => 14000,
                    "month" => 60000,
                    _ => 2000
                }
            };

            // Generate timeline data
            var timeline = new List<object>();
            var currentDate = startDate;
            while (currentDate < endDate)
            {
                var dayTrainings = trainings.Where(t => t.Date.Date == currentDate.Date);
                var dayMeals = meals.Where(m => m.Date.Date == currentDate.Date);

                timeline.Add(new
                {
                    date = currentDate.ToString("MM/dd"),
                    caloriesBurned = dayTrainings.Sum(t => t.Exercises?.Sum(e => e.CaloriesBurned ?? 0) ?? 0),
                    caloriesConsumed = dayMeals.Sum(m => m.Products?.Sum(p => p.Calories) ?? 0)
                });

                currentDate = currentDate.AddDays(1);
            }

            _logger.LogInformation($"Generated timeline with {timeline.Count} data points");

            return Json(new
            {
                training = trainingStats,
                nutrition = nutritionStats,
                timeline = new
                {
                    labels = timeline.Select(t => ((dynamic)t).date).ToList(),
                    caloriesBurned = timeline.Select(t => ((dynamic)t).caloriesBurned).ToList(),
                    caloriesConsumed = timeline.Select(t => ((dynamic)t).caloriesConsumed).ToList()
                }
            });
        }

        private DateTime GetWeekStartDate(DateTime date)
        {
            // Get the Monday of the current week
            int diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            return date.AddDays(-1 * diff).Date;
        }

        private DateTime GetWeekEndDate(DateTime date)
        {
            // Get the Sunday of the current week and add one day to get the start of next week
            return GetWeekStartDate(date).AddDays(7);
        }

        private DateTime GetMonthStartDate(DateTime date)
        {
            // Get the first day of the current month
            return new DateTime(date.Year, date.Month, 1);
        }

        private DateTime GetMonthEndDate(DateTime date)
        {
            // Get the first day of the next month
            return date.Month == 12 
                ? new DateTime(date.Year + 1, 1, 1)
                : new DateTime(date.Year, date.Month + 1, 1);
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
