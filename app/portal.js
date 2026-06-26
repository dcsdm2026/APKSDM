async function prosesLogin(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const alertError = document.getElementById("alert-error");

    alertError.classList.add("hidden");

    try {
        const { data, error } = await supabase
            .from("role_akses")
            .select("*")
            .eq("email", email)
            .eq("password", password)
            .single();

        if (error || !data) {
            throw new Error("Email atau kata sandi salah!");
        }

        // Simpan sesi user ke localStorage
        localStorage.setItem("user_session", JSON.stringify(data));
        window.location.href = "index.html";
    } catch (err) {
        alertError.innerText = err.message;
        alertError.classList.remove("hidden");
    }
}
