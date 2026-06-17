// Tab switching functionality
        document.addEventListener('DOMContentLoaded', function() {
            const buttons = document.querySelectorAll('.btn');
            const sections = document.querySelectorAll('.content-section');
            
            buttons.forEach(button => {
                button.addEventListener('click', function() {
                    // Remove active class from all buttons and sections
                    buttons.forEach(btn => btn.classList.remove('active'));
                    sections.forEach(section => section.classList.remove('active'));
                    
                    // Add active class to clicked button
                    this.classList.add('active');
                    
                    // Show corresponding section
                    const sectionId = this.getAttribute('data-section');
                    document.getElementById(sectionId).classList.add('active');
                });
            });
        });

        // Modal functionality
        function openModal() {
            document.getElementById('appointmentModal').style.display = 'flex';
            document.getElementById('successMessage').style.display = 'none';
            // Set minimum date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('appointmentDate').min = today;
            // Reset form fields
            document.getElementById('patientName').value = '';
            document.getElementById('patientDob').value = '';
            document.getElementById('patientGender').value = '';
            document.getElementById('contactNumber').value = '';
            document.getElementById('patientEmail').value = '';
            document.getElementById('visitType').value = '';
            document.getElementById('appointmentDate').value = '';
            document.getElementById('timeSlotsContainer').style.display = 'none';
            document.getElementById('cancerConcern').value = '';
            document.getElementById('additionalNotes').value = '';
        }

        function closeModal() {
            document.getElementById('appointmentModal').style.display = 'none';
        }

        // Generate time slots based on selected date
        function generateTimeSlots() {
            const dateInput = document.getElementById('appointmentDate');
            const timeSlotsContainer = document.getElementById('timeSlotsContainer');
            const selectedDateDisplay = document.getElementById('selectedDateDisplay');
            const timeSlots = document.getElementById('timeSlots');
            
            if (!dateInput.value) {
                timeSlotsContainer.style.display = 'none';
                return;
            }
            
            // Format the selected date for display
            const selectedDate = new Date(dateInput.value);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            selectedDateDisplay.textContent = selectedDate.toLocaleDateString('en-US', options);
            
            // Clear previous time slots
            timeSlots.innerHTML = '';
            
            // Generate time slots (9:00 AM to 5:00 PM with 30-minute intervals)
            const startHour = 9;
            const endHour = 17;
            const interval = 30; // minutes
            
            for (let hour = startHour; hour < endHour; hour++) {
                for (let minute = 0; minute < 60; minute += interval) {
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    const displayTime = `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
                    
                    // Create time slot element
                    const slot = document.createElement('div');
                    slot.className = 'time-slot';
                    slot.dataset.time = timeString;
                    slot.innerHTML = `${displayTime}<span class="time-slot-label">30 min</span>`;
                    
                    // Randomly mark some slots as unavailable (for demo)
                    // In real app, this would check against booked appointments
                    const isUnavailable = Math.random() < 0.3; // 30% chance of being unavailable
                    if (isUnavailable) {
                        slot.classList.add('unavailable');
                    } else {
                        slot.addEventListener('click', function() {
                            // Remove selected class from all slots
                            document.querySelectorAll('.time-slot').forEach(s => {
                                s.classList.remove('selected');
                            });
                            // Add selected class to clicked slot
                            this.classList.add('selected');
                        });
                    }
                    
                    timeSlots.appendChild(slot);
                }
            }
            
            timeSlotsContainer.style.display = 'block';
        }

        function submitAppointment() {
            // Get form values
            const patientName = document.getElementById('patientName').value;
            const patientDob = document.getElementById('patientDob').value;
            const patientGender = document.getElementById('patientGender').value;
            const contactNumber = document.getElementById('contactNumber').value;
            const patientEmail = document.getElementById('patientEmail').value;
            const visitType = document.getElementById('visitType').value;
            const appointmentDate = document.getElementById('appointmentDate').value;
            const selectedTimeSlot = document.querySelector('.time-slot.selected');
            const cancerConcern = document.getElementById('cancerConcern').value;
            const additionalNotes = document.getElementById('additionalNotes').value;

            // Simple validation
            if (!patientName || !patientDob || !patientGender || !contactNumber || 
                !patientEmail || !visitType || !appointmentDate || !selectedTimeSlot || !cancerConcern) {
                alert('Please fill in all required fields and select a time slot');
                return;
            }

            // Here you would typically send this data to a server
            // For this example, we'll just show the success message
            document.getElementById('successMessage').style.display = 'block';

            // Log the appointment details (in a real app, this would be an API call)
            console.log('New Appointment Request:');
            console.log('Patient:', patientName);
            console.log('DOB:', patientDob);
            console.log('Gender:', patientGender);
            console.log('Contact:', contactNumber);
            console.log('Email:', patientEmail);
            console.log('Visit Type:', visitType);
            console.log('Date:', new Date(appointmentDate).toLocaleDateString());
            console.log('Time:', selectedTimeSlot.dataset.time);
            console.log('Concern:', cancerConcern);
            console.log('Notes:', additionalNotes);
            console.log('Doctor:', document.getElementById('selectedDoctor').value);

            // Clear form after 3 seconds and close modal after 5 seconds
            setTimeout(() => {
                document.getElementById('patientName').value = '';
                document.getElementById('patientDob').value = '';
                document.getElementById('patientGender').value = '';
                document.getElementById('contactNumber').value = '';
                document.getElementById('patientEmail').value = '';
                document.getElementById('visitType').value = '';
                document.getElementById('appointmentDate').value = '';
                document.getElementById('timeSlotsContainer').style.display = 'none';
                document.getElementById('cancerConcern').value = '';
                document.getElementById('additionalNotes').value = '';
            }, 3000);

            setTimeout(() => {
                closeModal();
            }, 5000);
        }

        // Close modal when clicking outside of it
        window.onclick = function(event) {
            const modal = document.getElementById('appointmentModal');
            if (event.target == modal) {
                closeModal();
            }
        }