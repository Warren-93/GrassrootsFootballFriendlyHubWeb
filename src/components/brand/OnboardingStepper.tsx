import { Step, StepLabel, Stepper } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { brand } from '../../theme/theme';

const STEP_LABELS = ['Role & club', 'Team & venue', 'Availability'] as const;

interface OnboardingStepperProps {
  /** 1-indexed - which step of the onboarding wizard the current page belongs to. */
  currentStep: 1 | 2 | 3;
}

interface StepCircleProps {
  active: boolean;
  completed: boolean;
  number: number;
}

/** Numbered circle matching the concept: green+check when done, navy+number when active, muted outline when upcoming. */
function StepCircle({ active, completed, number }: StepCircleProps) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: completed || active ? '#fff' : brand.muted,
        backgroundColor: completed ? brand.pitch : active ? brand.void : brand.mist,
        border: completed || active ? 'none' : `1px solid ${brand.border}`,
        boxSizing: 'border-box',
      }}
    >
      {completed ? <CheckIcon sx={{ fontSize: 16 }} /> : number}
    </div>
  );
}

/**
 * Small numbered progress stepper shown at the top of every onboarding page, so the user always
 * knows where they are in the 3-step "Role & club" -> "Team & venue" -> "Availability" wizard.
 * Built on MUI's own Stepper/Step/StepLabel, restyled to match the PitchMate brand colours.
 */
export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  return (
    <Stepper
      activeStep={currentStep - 1}
      alternativeLabel
      sx={{
        '& .MuiStepConnector-line': { borderColor: brand.border },
        '& .MuiStepLabel-label': {
          fontSize: 12,
          fontWeight: 700,
          color: brand.muted,
          mt: 0.5,
          '&.Mui-active': { color: brand.ink },
          '&.Mui-completed': { color: brand.ink },
        },
      }}
    >
      {STEP_LABELS.map((label, index) => (
        <Step key={label}>
          <StepLabel
            icon={
              <StepCircle
                active={index === currentStep - 1}
                completed={index < currentStep - 1}
                number={index + 1}
              />
            }
          >
            {label}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
