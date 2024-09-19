import { Box, Link } from "@mui/material"

export default function Footer() {
 
  return (
    <footer className="footer">
      <Box
        sx={{
          mt: "1rem",
          mb: 0.2,
          padding: "0.1rem",
        }}
      >
        Made by&nbsp; <Link href="https://bit.ly/GitHub-OpenAssist-API" underline="hover"><img src="MIC.png" alt="Mic" width={50} /></Link>
      </Box>
    </footer>
  )
}