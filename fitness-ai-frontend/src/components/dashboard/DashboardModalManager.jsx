// src/components/dashboard/DashboardModalManager.jsx
import React, { Suspense, lazy } from 'react';
import LoadingFallback from '../LoadingFallback';
import AiReasoningModal from './AiReasoningModal';

// Dynamic lazy imports for heavy modals
const AuthModal = lazy(() => import('../AuthModal'));
const PackageModal = lazy(() => import('../PackageModal'));
const BookingModal = lazy(() => import('../BookingModal'));
const ReviewModal = lazy(() => import('../ReviewModal'));
const LiveWorkoutModal = lazy(() => import('../LiveWorkoutModal'));
const ProgressAnalyticsModal = lazy(() => import('../ProgressAnalyticsModal'));
const MealTrackerModal = lazy(() => import('../MealTrackerModal'));
const ChatModal = lazy(() => import('../ChatModal'));
const LeaderboardModal = lazy(() => import('../LeaderboardModal'));
const ProgressReportModal = lazy(() => import('../ProgressReportModal'));
const ExerciseLibraryModal = lazy(() => import('../ExerciseLibraryModal'));
const ProfileModal = lazy(() => import('../ProfileModal'));

export default function DashboardModalManager({
  activeModal,
  closeModal,
  openModal,
  authModalMode,
  userPackage,
  currentUser,
  exercises,
  planData,
  nutritionGoals,
  unreadChatCount,
  onAuthSuccess,
  onDataRefresh,
  onAddExerciseFromLibrary,
  onProfileUpdated,
}) {
  return (
    <Suspense fallback={<LoadingFallback message="Đang tải dữ liệu cửa sổ..." />}>
      {/* 1. Auth Modal */}
      {activeModal === 'auth' && (
        <AuthModal
          isOpen={true}
          initialMode={authModalMode}
          onClose={closeModal}
          onSuccess={onAuthSuccess}
        />
      )}

      {/* 2. Package Store Modal */}
      {activeModal === 'package' && (
        <PackageModal
          isOpen={true}
          onClose={closeModal}
          currentPackage={userPackage}
          onOpenAuth={() => openModal('auth', 'register')}
          onSuccess={onDataRefresh}
        />
      )}

      {/* 3. Booking Modal */}
      {activeModal === 'booking' && (
        <BookingModal
          isOpen={true}
          onClose={closeModal}
          user={currentUser}
          userPackage={userPackage}
          defaultTrainerId={userPackage?.trainer_id}
          onSuccess={onDataRefresh}
        />
      )}

      {/* 4. Review Modal */}
      {activeModal === 'review' && (
        <ReviewModal
          isOpen={true}
          userPackage={userPackage}
          packageId={userPackage?.id}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            onDataRefresh();
          }}
        />
      )}

      {/* 5. AI Reasoning Modal */}
      <AiReasoningModal
        isOpen={activeModal === 'reasoning'}
        onClose={closeModal}
        data={planData}
        aiReasoning={planData?.ai_reasoning}
        protein={nutritionGoals?.protein}
        fat={nutritionGoals?.fat}
        carbs={nutritionGoals?.carbs}
      />

      {/* 6. Live Workout Modal */}
      {activeModal === 'liveWorkout' && (
        <LiveWorkoutModal
          isOpen={true}
          onClose={closeModal}
          exercises={exercises}
          planId={planData?.id}
          onSuccess={() => {
            onDataRefresh();
            openModal('progress');
          }}
        />
      )}

      {/* 7. Progress & Weight Analytics Modal */}
      {activeModal === 'progress' && (
        <ProgressAnalyticsModal
          isOpen={true}
          onClose={closeModal}
          onWeightUpdated={onDataRefresh}
        />
      )}

      {/* 8. Meal Tracker Modal */}
      {activeModal === 'mealTracker' && (
        <MealTrackerModal
          isOpen={true}
          onClose={closeModal}
          targetNutrition={{
            targetCalories: nutritionGoals?.calories,
            protein: nutritionGoals?.protein,
            carbs: nutritionGoals?.carbs,
            fat: nutritionGoals?.fat
          }}
          onMealsUpdated={onDataRefresh}
        />
      )}

      {/* 9. Direct Chat with PT Modal */}
      {activeModal === 'chat' && (
        <ChatModal
          isOpen={true}
          onClose={() => {
            closeModal();
            onDataRefresh();
          }}
          defaultPartnerId={userPackage?.trainer_user_id || 2}
          defaultPartnerName={userPackage?.trainer_name || 'Coach Minh Tuấn'}
          initialMode={unreadChatCount > 0 ? 'pt' : 'ai'}
        />
      )}

      {/* 10. Leaderboard Modal */}
      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {/* 11. Progress Report Modal */}
      {activeModal === 'report' && (
        <ProgressReportModal
          isOpen={true}
          onClose={closeModal}
          userId={currentUser?.id}
          userName={currentUser?.full_name}
        />
      )}

      {/* 12. Exercise Library Modal */}
      {activeModal === 'library' && (
        <ExerciseLibraryModal
          isOpen={true}
          onClose={closeModal}
          onAddExercise={onAddExerciseFromLibrary}
        />
      )}

      {/* 13. Profile Modal */}
      {activeModal === 'profile' && (
        <ProfileModal
          isOpen={true}
          onClose={closeModal}
          currentUser={currentUser}
          onProfileUpdated={onProfileUpdated}
        />
      )}
    </Suspense>
  );
}
