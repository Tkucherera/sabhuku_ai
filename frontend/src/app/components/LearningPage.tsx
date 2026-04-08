import { PlatformLayout } from "./PlatformLayout";
import { BookOpen, Clock, Award, Play, CheckCircle } from "lucide-react";

export function LearningPage() {
  const courses = [
    {
      id: 1,
      title: "Introduction to AI for Africa",
      description: "Learn the fundamentals of artificial intelligence with a focus on African applications and contexts.",
      instructor: "Dr. Tendai Moyo",
      difficulty: "Beginner",
      duration: "4 hours",
      lessons: 12,
      enrolled: 2341,
      progress: 67,
      thumbnail: "https://images.unsplash.com/photo-1717501219263-9aa2d6a768d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3NzU1NTY3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 2,
      title: "Building NLP Models with African Languages",
      description: "Master natural language processing techniques for African languages including Shona, Ndebele, and Swahili.",
      instructor: "Prof. Chipo Nhemachena",
      difficulty: "Intermediate",
      duration: "8 hours",
      lessons: 18,
      enrolled: 1567,
      progress: 34,
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkfGVufDF8fHx8MTc3NTUyODgzMHww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 3,
      title: "Computer Vision for Wildlife Conservation",
      description: "Apply computer vision and deep learning to wildlife monitoring and conservation in Africa.",
      instructor: "Sarah Mutasa",
      difficulty: "Advanced",
      duration: "10 hours",
      lessons: 22,
      enrolled: 892,
      progress: 0,
      thumbnail: "https://images.unsplash.com/photo-1650357519740-c888919621f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx6aW1iYWJ3ZSUyMGxhbmRzY2FwZSUyMG1vZGVybnxlbnwxfHx8fDE3NzU1ODA3NjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 4,
      title: "Data Science for SADC Economic Analysis",
      description: "Learn to analyze and visualize economic data specific to the SADC region using Python and R.",
      instructor: "Dr. James Ncube",
      difficulty: "Intermediate",
      duration: "6 hours",
      lessons: 15,
      enrolled: 1234,
      progress: 0,
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkfGVufDF8fHx8MTc3NTUyODgzMHww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 5,
      title: "Machine Learning Ethics in African Contexts",
      description: "Explore ethical considerations and responsible AI practices relevant to African societies and cultures.",
      instructor: "Dr. Rudo Dube",
      difficulty: "Beginner",
      duration: "3 hours",
      lessons: 8,
      enrolled: 1876,
      progress: 100,
      thumbnail: "https://images.unsplash.com/photo-1717501219263-9aa2d6a768d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3NzU1NTY3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 6,
      title: "Deep Learning for Agricultural Applications",
      description: "Use deep learning to solve agricultural challenges in Zimbabwe and Southern Africa.",
      instructor: "Tafadzwa Chirwa",
      difficulty: "Advanced",
      duration: "12 hours",
      lessons: 25,
      enrolled: 654,
      progress: 0,
      thumbnail: "https://images.unsplash.com/photo-1650357519740-c888919621f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx6aW1iYWJ3ZSUyMGxhbmRzY2FwZSUyMG1vZGVybnxlbnwxfHx8fDE3NzU1ODA3NjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ];

  const learningPaths = [
    {
      id: 1,
      title: "AI Fundamentals Track",
      courses: 5,
      duration: "20 hours",
      completedCourses: 3,
    },
    {
      id: 2,
      title: "NLP Specialist Path",
      courses: 7,
      duration: "35 hours",
      completedCourses: 1,
    },
    {
      id: 3,
      title: "Data Science Professional",
      courses: 8,
      duration: "40 hours",
      completedCourses: 2,
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-700";
      case "Intermediate":
        return "bg-blue-100 text-blue-700";
      case "Advanced":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <PlatformLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Resources</h1>
          <p className="text-gray-600">
            Develop your AI and data science skills with courses designed for African contexts
          </p>
        </div>

        {/* Learning Paths */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Learning Paths</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {learningPaths.map((path) => (
              <div
                key={path.id}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h3 className="font-bold text-lg mb-2">{path.title}</h3>
                <div className="flex items-center gap-3 text-sm text-blue-100 mb-4">
                  <span>{path.courses} courses</span>
                  <span>•</span>
                  <span>{path.duration}</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>
                      {path.completedCourses}/{path.courses}
                    </span>
                  </div>
                  <div className="w-full bg-blue-500/30 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2"
                      style={{ width: `${(path.completedCourses / path.courses) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Courses Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">All Courses</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                My Courses
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                Browse All
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  {course.progress > 0 && (
                    <div className="absolute top-3 right-3">
                      {course.progress === 100 ? (
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </div>
                      ) : (
                        <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-xs font-medium">
                          {course.progress}% Complete
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${getDifficultyColor(
                        course.difficulty
                      )}`}
                    >
                      {course.difficulty}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.instructor}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      {course.lessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </span>
                  </div>

                  {course.progress > 0 ? (
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 rounded-full h-1.5"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : null}

                  <button
                    className={`w-full py-2 rounded-lg font-medium text-sm ${
                      course.progress > 0
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {course.progress === 100
                      ? "Review Course"
                      : course.progress > 0
                      ? "Continue Learning"
                      : "Start Course"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="font-bold text-gray-900 mb-1">5 Courses</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <div className="font-bold text-gray-900 mb-1">48 Hours</div>
              <div className="text-sm text-gray-600">Learning Time</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="font-bold text-gray-900 mb-1">3 Certificates</div>
              <div className="text-sm text-gray-600">Earned</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <div className="font-bold text-gray-900 mb-1">Top 10%</div>
              <div className="text-sm text-gray-600">Rank</div>
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
