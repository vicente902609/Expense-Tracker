import { alpha } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";

import { formatMonthLabel, getGreeting, getInitials } from "../../../lib/expense-ui.js";

type DashboardHeaderProps = {
  userFirstName: string;
  userName: string;
  referenceIsoDate: string;
};

export const DashboardHeader = ({ userFirstName, userName, referenceIsoDate }: DashboardHeaderProps) => (
  <Box
    sx={(theme) => ({
      p: { xs: 2, sm: 2.5, md: 3 },
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 55%)`,
      borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
    })}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: "1.35rem", sm: "1.5rem", md: "1.75rem" },
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
          }}
        >
          {getGreeting()}, {userFirstName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {formatMonthLabel(referenceIsoDate)}
        </Typography>
      </Box>
      <Box
        sx={(theme) => ({
          width: { xs: 44, sm: 48 },
          height: { xs: 44, sm: 48 },
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          fontSize: "0.9rem",
          fontWeight: 700,
          bgcolor: alpha(theme.palette.primary.main, 0.22),
          color: theme.palette.primary.light,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
        })}
      >
        {getInitials(userName)}
      </Box>
    </Stack>
  </Box>
);
