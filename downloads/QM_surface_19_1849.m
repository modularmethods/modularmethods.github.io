
K<a> := NumberField(Polynomial([5,-1,1]));
ZK := MaximalOrder(K);

_<x> := PolynomialRing(K);
Py<y> := PolynomialRing(Rationals());

f := (3 + 5*a)*x^6 + (68 - 24*a)*x^5 + (- 148 - 56*a )*x^4 + (136*a - 224)*x^3 + (64*a + 240)*x^2 + (116 -60*a )*x +( - 20- 12*a);

C := HyperellipticCurve(f);

_<x> := PolynomialRing(Rationals());
EulerFacIdeal := function(P)
  if P eq LMFDBIdeal(K,"43.1") then // ideal in conductor of norm 43
    return 1;
  elif P eq 2*ZK then
    return 1 - 2*x +4*x^2;
  else
  	fac := EulerFactor(C,P : Degree := 1);
  	ee := Eltseq(fac);
  	if #ee eq 1 then
  		ap := 0;
  	else 
  		ap := ee[2]/2;
  	end if;  	
    E := 1 + ap*y + Norm(P)*y^2;
    return E;
  end if;
end function;


EulerFacNum := function(p)
  ID := p*ZK;
  fac := Factorization(ID);
  if #fac eq 1 then
    if fac[1][2] eq 1 then
      return Evaluate(EulerFacIdeal(ID),x^2); // inert
    else
      return EulerFacIdeal(fac[1,1]); // ramified
    end if;
  else
    return EulerFacIdeal(fac[1,1]) * EulerFacIdeal(fac[2,1]); // split
  end if;
end function;


L := LSeries(
2, //weight
[0,0,1,1], // gamma factors
19^2*1849, // conductor
func<p,d|EulerFacNum(p)>
);


// uncomment for progress on the computation 
//SetVerbose("LSeries",3);
LSetPrecision(L,5);
printf "Need %o coefficients to compute L-values", LCfRequired(L);


//

CC := ComplexField(30);
ff := Polynomial([CC!Evaluate(u,InfinitePlaces(K)[1]) : u in Coefficients(f)]);
JJ := AnalyticJacobian(ff);

per := BigPeriodMatrix(JJ);

M := Matrix([&cat[[Re(per[i,j]),Im(per[i,j])] : i in [1..2]] : j in [1..4]]);

ratio := Evaluate(L,1)^2/Abs(Determinant(M));

printf "Ratio L(f,1)^2/Abs(Det(M)): %o", ratio;
printf "L(f,1)^2/Abs(Det(M)) - 80/19: %o", ratio - 80/19;
